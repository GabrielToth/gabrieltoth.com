/**
 * CSRF Protection — Stateless HMAC-Signed Token Pattern
 *
 * Instead of storing CSRF tokens in server memory (which breaks on serverless
 * where each request may hit a different instance), this uses a cryptographically
 * signed token that is self-validating.
 *
 * The CSRF token is an HMAC-SHA256 signature of `sessionToken:expiryTimestamp`.
 * The server signs it with CSRF_SECRET and validates by recomputing the HMAC.
 * No server-side storage, no database, no cookies needed — works across all
 * serverless instances.
 *
 * Frontend flow (unchanged):
 * 1. GET /api/auth/csrf → get signed token
 * 2. Send token in X-CSRF-Token header on POST/PUT/DELETE
 * 3. Server validates signature + session binding + expiry
 */

import crypto from "crypto"
import { logger } from "@/lib/logger"

const CSRF_TOKEN_EXPIRY_SECONDS = 24 * 60 * 60 // 24 hours
const CSRF_SECRET =
    process.env.CSRF_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "csrf-dev-secret-do-not-use-in-production"

/**
 * Generate an HMAC-signed CSRF token bound to a session.
 * Token format: base64url(sessionToken:expiry).hmac_hex
 *
 * This is stateless — the token is self-validating on verify.
 */
export function generateCsrfTokenForSession(sessionToken: string): string {
    if (!sessionToken) {
        logger.warn("generateCsrfTokenForSession called without sessionToken", {
            context: "Security",
        })
        return ""
    }

    const expiry = Math.floor(Date.now() / 1000) + CSRF_TOKEN_EXPIRY_SECONDS
    const nonce = crypto.randomBytes(8).toString("hex")
    const payload = `${sessionToken}:${expiry}:${nonce}`
    const encodedPayload = Buffer.from(payload).toString("base64url")
    const signature = crypto
        .createHmac("sha256", CSRF_SECRET)
        .update(payload)
        .digest("hex")

    return `${encodedPayload}.${signature}`
}

/**
 * Validate an HMAC-signed CSRF token.
 * Verifies:
 * 1. Token format is valid (payload.signature)
 * 2. HMAC signature matches (tamper detection)
 * 3. Session token in payload matches the caller's session
 * 4. Token has not expired
 */
export function validateCsrfToken(
    sessionToken: string,
    csrfToken: string
): boolean {
    if (!sessionToken || !csrfToken) {
        return false
    }

    try {
        const parts = csrfToken.split(".")
        if (parts.length !== 2) {
            return false
        }

        const [encodedPayload, signature] = parts
        const payload = Buffer.from(encodedPayload, "base64url").toString()

        // Split payload into session token, expiry, and nonce
        // Format: sessionToken:expiryTimestamp:nonce
        const parts_ = payload.split(":")
        if (parts_.length < 3) {
            return false
        }
        const expiryStr = parts_[parts_.length - 2]
        const tokenPart = parts_.slice(0, -2).join(":")
        const expiry = parseInt(expiryStr, 10)

        // Verify session token matches
        if (tokenPart !== sessionToken) {
            return false
        }

        // Verify not expired
        if (isNaN(expiry) || expiry < Math.floor(Date.now() / 1000)) {
            return false
        }

        // Verify HMAC signature
        const expectedSignature = crypto
            .createHmac("sha256", CSRF_SECRET)
            .update(payload)
            .digest("hex")

        const sigBuf = Buffer.from(signature)
        const expectedBuf = Buffer.from(expectedSignature)

        if (sigBuf.length !== expectedBuf.length) {
            return false
        }

        return crypto.timingSafeEqual(sigBuf, expectedBuf)
    } catch (error) {
        logger.warn("CSRF validation failed with error", {
            context: "Security",
            error: error instanceof Error ? error.message : String(error),
        })
        return false
    }
}

/**
 * No-op: stateless tokens cannot be invalidated server-side.
 * The token will naturally expire after CSRF_TOKEN_EXPIRY_SECONDS.
 * Keeping for backward compatibility.
 */
export function invalidateCsrfToken(_sessionToken: string): void {
    // Stateless HMAC tokens cannot be invalidated early.
    // Rely on expiry. On logout, the session cookie is cleared
    // which makes the token useless (sessionToken won't match).
}

/**
 * Get or generate a CSRF token for a session.
 * Since tokens are stateless, this always generates a fresh one.
 * Keeping for backward compatibility.
 */
export function getCsrfToken(sessionToken: string): string | null {
    if (!sessionToken) return null
    return generateCsrfTokenForSession(sessionToken)
}

/**
 * Inject CSRF token into response (for JSON responses)
 */
export function injectCsrfToken(csrfToken: string): { csrfToken: string } {
    return { csrfToken }
}
