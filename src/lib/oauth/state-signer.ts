/**
 * OAuth State Signer
 * Generates and verifies cryptographically signed state tokens for OAuth flows.
 * Uses HMAC-SHA256 so no external cache (Redis) is needed — the state IS the proof.
 *
 * The state token is a URL-safe base64-encoded JSON payload + HMAC signature:
 *   `${base64(payload)}.${base64(signature)}`
 *
 * Payload contains: userId, platform, nonce, iat (issued-at timestamp)
 */

import crypto from "crypto"

const SIGNING_ALGORITHM = "sha256"
const STATE_EXPIRY_MS = 10 * 60 * 1000

function getSigningKey(): string {
    return (
        process.env.OAUTH_STATE_SECRET || process.env.TOKEN_ENCRYPTION_KEY || ""
    )
}

export interface StatePayload {
    userId: string
    platform: string
    nonce: string
    iat: number
    locale?: string
    redirectTo?: string
    codeVerifier?: string
}

export interface SignedState {
    token: string
    payload: StatePayload
}

/**
 * Generate a signed OAuth state token.
 * No Redis needed — the state is self-verifiable via HMAC.
 */
export function generateState(
    userId: string,
    platform: string,
    locale?: string,
    redirectTo?: string,
    codeVerifier?: string
): SignedState {
    const key = getSigningKey()
    if (!key) {
        throw new Error(
            "OAUTH_STATE_SECRET or TOKEN_ENCRYPTION_KEY must be set to generate OAuth state"
        )
    }

    const payload: StatePayload = {
        userId,
        platform,
        nonce: crypto.randomBytes(16).toString("hex"),
        iat: Date.now(),
        locale,
        redirectTo,
        codeVerifier,
    }

    const payloadJson = JSON.stringify(payload)
    const payloadBase64 = Buffer.from(payloadJson).toString("base64url")

    const hmac = crypto.createHmac(SIGNING_ALGORITHM, key)
    hmac.update(payloadBase64)
    const signature = hmac.digest().toString("base64url")

    return {
        token: `${payloadBase64}.${signature}`,
        payload,
    }
}

export interface VerificationResult {
    valid: boolean
    payload: StatePayload | null
    error?: string
}

/**
 * Verify a signed OAuth state token.
 * Checks HMAC signature AND expiration (10-minute window).
 */
export function verifyState(token: string): VerificationResult {
    const key = getSigningKey()
    if (!key) {
        return {
            valid: false,
            payload: null,
            error: "Signing key not configured",
        }
    }

    const parts = token.split(".")
    if (parts.length !== 2) {
        return { valid: false, payload: null, error: "Invalid state format" }
    }

    const [payloadBase64, signature] = parts

    try {
        const hmac = crypto.createHmac(SIGNING_ALGORITHM, key)
        hmac.update(payloadBase64)
        const expectedSignature = hmac.digest().toString("base64url")

        if (signature !== expectedSignature) {
            return {
                valid: false,
                payload: null,
                error: "Invalid state signature",
            }
        }

        const payloadJson = Buffer.from(payloadBase64, "base64url").toString(
            "utf-8"
        )
        const payload: StatePayload = JSON.parse(payloadJson)

        if (
            !payload.userId ||
            !payload.platform ||
            !payload.nonce ||
            !payload.iat
        ) {
            return {
                valid: false,
                payload: null,
                error: "Invalid state payload structure",
            }
        }

        const age = Date.now() - payload.iat
        if (age > STATE_EXPIRY_MS) {
            return { valid: false, payload: null, error: "State token expired" }
        }

        if (age < 0) {
            return {
                valid: false,
                payload: null,
                error: "State token is from the future",
            }
        }

        return { valid: true, payload }
    } catch {
        return {
            valid: false,
            payload: null,
            error: "Failed to verify state token",
        }
    }
}
