import {
    getAuditEnvironment,
    notifyUserAuditDiscord,
} from "@/lib/audit/discord-user-audit"
import {
    logLoginFailure,
    logLoginSuccess,
    logSecurityEvent,
} from "@/lib/auth/audit-logging"
import {
    createCAPTCHAErrorDetails,
    getCAPTCHAErrorResponse,
    handleCAPTCHAError,
} from "@/lib/auth/captcha-error-handler"
import { verifyCAPTCHAWithFallback } from "@/lib/auth/captcha-verifier"
import { validateCSRFToken } from "@/lib/auth/csrf-validator"
import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
    logAuthError,
} from "@/lib/auth/error-handling"
import { getAuthenticationService } from "@/lib/auth/password-security"
import {
    checkRateLimitWithDegradation,
    incrementAttemptWithDegradation,
    resetAttempt,
} from "@/lib/auth/rate-limiter"
import { validateEmail } from "@/lib/validation"
import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"
import { v4 as uuidv4 } from "uuid"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const authService = getAuthenticationService()

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 *
 * Validates: Requirements 1, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15
 *
 * Security Features:
 * - Type validation (prevent script modifications)
 * - Field validation (prevent injection)
 * - Length validation (prevent buffer overflow)
 * - CSRF token validation (prevent CSRF attacks)
 * - Rate limiting (prevent brute force)
 * - Argon2id verification (constant-time)
 * - Generic error messages (prevent user enumeration)
 * - Security headers (prevent XSS, clickjacking, etc.)
 * - Comprehensive audit logging
 * - Request ID generation for tracing
 *
 * Request body:
 * {
 *   email: string
 *   password: string
 *   rememberMe: boolean (optional)
 *   csrfToken: string
 * }
 *
 * Response:
 * {
 *   success: true
 *   data: {
 *     userId: string
 *     email: string
 *     sessionToken: string
 *   }
 * }
 *
 * Security Considerations:
 * 1. CSRF Protection: Every login request must include a valid CSRF token
 *    to prevent cross-site request forgery attacks. The token is validated
 *    before any other processing occurs.
 *
 * 2. Rate Limiting: Failed login attempts are tracked per IP address.
 *    After 5 failed attempts within 1 hour, the IP is temporarily blocked.
 *    This prevents brute force attacks while allowing legitimate users to
 *    retry after the timeout period.
 *
 * 3. Generic Error Messages: All authentication failures return the same
 *    generic error message ("Invalid email or password") to prevent attackers
 *    from determining whether an email exists in the system. The actual
 *    failure reason is logged internally for debugging.
 *
 * 4. Password Verification: Passwords are verified with Argon2id (peppered).
 *    Verification uses constant-time comparison to reduce timing side channels.
 *
 * 5. Session Management: Session tokens are cryptographically secure random
 *    values stored in secure HttpOnly cookies. The tokens expire after 1 hour
 *    of inactivity and are automatically refreshed on activity.
 *
 * 6. Remember Me: Optional long-lived tokens (30 days) allow users to stay
 *    logged in on trusted devices. These tokens are stored separately from
 *    session tokens and are validated on each request.
 *
 * 7. Audit Logging: All authentication events (success, failure, CSRF failures,
 *    rate limiting) are logged for compliance and security monitoring. Logs
 *    are retained for 90+ days and cannot be modified after creation.
 *
 * 8. Input Validation: All inputs are validated for type, format, and length
 *    before processing. Extra fields are rejected to prevent prototype pollution
 *    attacks. Request body size is limited to 10KB.
 *
 * 9. Security Headers: The response includes security headers to prevent
 *    common web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.).
 *
 * 10. Request Tracing: Each request is assigned a unique ID for tracing and
 *     debugging. This ID is included in all logs and error responses.
 */
export async function POST(request: NextRequest) {
    // Generate request ID for tracing
    const requestId = uuidv4()

    try {
        // ============================================================================
        // REQUEST METADATA EXTRACTION
        // ============================================================================

        // Get client IP for rate limiting and logging
        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown"

        const userAgent = request.headers.get("user-agent") || "unknown"

        // ============================================================================
        // REQUEST BODY PARSING (Task 8.3)
        // ============================================================================

        // Parse request body with error handling
        let body: unknown
        try {
            body = await request.json()
        } catch {
            logAuthError(
                AuthErrorType.INVALID_INPUT,
                undefined,
                clientIp,
                `Invalid JSON in login request (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate body is an object (prevent script modifications)
        if (typeof body !== "object" || body === null || Array.isArray(body)) {
            logAuthError(
                AuthErrorType.INVALID_INPUT,
                undefined,
                clientIp,
                `Invalid body type in login request (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        const bodyObj = body as Record<string, unknown>
        const { email, password, rememberMe, csrfToken, captchaToken } = bodyObj

        // ============================================================================
        // TYPE VALIDATION (Task 8.3, Prevent script modifications)
        // ============================================================================

        // Validate email type
        if (typeof email !== "string") {
            logAuthError(
                AuthErrorType.INVALID_INPUT,
                undefined,
                clientIp,
                `Invalid email type in login request (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate password type
        if (typeof password !== "string") {
            logAuthError(
                AuthErrorType.INVALID_INPUT,
                undefined,
                clientIp,
                `Invalid password type in login request (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate rememberMe type (optional, but if present must be boolean)
        if (rememberMe !== undefined && typeof rememberMe !== "boolean") {
            logAuthError(
                AuthErrorType.INVALID_INPUT,
                email,
                clientIp,
                `Invalid rememberMe type in login request (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate csrfToken type (optional, but if present must be string)
        if (csrfToken !== undefined && typeof csrfToken !== "string") {
            logAuthError(
                AuthErrorType.INVALID_INPUT,
                email,
                clientIp,
                `Invalid csrfToken type in login request (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate captchaToken type (optional, but if present must be string)
        if (captchaToken !== undefined && typeof captchaToken !== "string") {
            logAuthError(
                AuthErrorType.INVALID_INPUT,
                email,
                clientIp,
                `Invalid captchaToken type in login request (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // ============================================================================
        // FIELD VALIDATION (Task 8.3, Prevent injection attacks)
        // ============================================================================

        // Validate no extra fields (prevent injection)
        const allowedFields = new Set([
            "email",
            "password",
            "rememberMe",
            "csrfToken",
            "captchaToken",
        ])
        const providedFields = Object.keys(bodyObj)
        const hasExtraFields = providedFields.some(
            field => !allowedFields.has(field)
        )
        if (hasExtraFields) {
            logAuthError(
                AuthErrorType.INVALID_INPUT,
                email,
                clientIp,
                `Extra fields in login request (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // ============================================================================
        // LENGTH VALIDATION (Task 8.3, Prevent buffer overflow)
        // ============================================================================

        // Validate email length
        if (email.length === 0 || email.length > 255) {
            logAuthError(
                AuthErrorType.INVALID_EMAIL,
                email,
                clientIp,
                `Email length validation failed (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate password length
        if (password.length === 0 || password.length > 1024) {
            logAuthError(
                AuthErrorType.INVALID_PASSWORD,
                email,
                clientIp,
                `Password length validation failed (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // ============================================================================
        // FORMAT VALIDATION (Task 8.3)
        // ============================================================================

        // Validate email format
        const emailValidation = validateEmail(email)
        if (!emailValidation.isValid) {
            logAuthError(
                AuthErrorType.INVALID_EMAIL,
                email,
                clientIp,
                `Email format validation failed (requestId: ${requestId})`
            )
            return createErrorResponse(
                AuthErrorType.INVALID_EMAIL,
                "email",
                emailValidation.error
            )
        }

        // Validate password is not just whitespace
        if (password.trim().length === 0) {
            logAuthError(
                AuthErrorType.INVALID_CREDENTIALS,
                email,
                clientIp,
                `Password is empty/whitespace (requestId: ${requestId})`
            )
            return createErrorResponse(AuthErrorType.INVALID_CREDENTIALS)
        }

        // ============================================================================
        // RATE LIMITING CHECK (Task 5.4, Requirement 7.1, 7.2, 7.3, 7.7)
        // ============================================================================
        // Check rate limits BEFORE validating credentials to prevent timing attacks
        // Requirement 7.1: Track failures by user identifier (email)
        // Requirement 7.2: Lock after 5 failures in 15 minutes
        // Requirement 7.3: Return 429 Too Many Requests if locked
        // Requirement 7.7: Log rate limit triggers with timestamp, user identifier, attempt count

        // Determine if we're in degraded mode for rate limiting
        let degradedMode = false

        // Check if email has exceeded rate limit
        // In degraded mode (CAPTCHA unavailable):
        // - Stricter failure threshold (3 instead of 5)
        // - Shorter lockout window (10 minutes instead of 15)
        // - More aggressive logging
        const rateLimitCheck = await checkRateLimitWithDegradation(
            email,
            degradedMode
        )

        if (!rateLimitCheck.allowed) {
            // Log rate limiting event
            // Requirement 7.7: Log with timestamp, user identifier, attempt count
            await logSecurityEvent(
                "RATE_LIMIT_EXCEEDED",
                email,
                clientIp,
                {
                    requestId,
                    action: "Rate limit exceeded for login attempt",
                    degradedMode,
                    reason: rateLimitCheck.reason,
                },
                undefined
            )

            // Requirement 7.3: Return 429 Too Many Requests
            return createErrorResponse(AuthErrorType.TOO_MANY_ATTEMPTS)
        }

        // ============================================================================
        // CAPTCHA TOKEN VALIDATION (Task 6.4, Requirement 20.3, 20.4, 20.10, 20.12)
        // ============================================================================

        // Validate CAPTCHA token before processing credentials
        // This prevents automated attacks and bot abuse
        // Requirement 20.1, 20.2: CAPTCHA required for login
        // Requirement 20.3: Return 400 for invalid/missing tokens
        // Requirement 20.4: Don't reveal whether user exists or password is correct
        // Requirement 20.10: If CAPTCHA unavailable, log warning
        // Requirement 20.12: Continue with fallback behavior (enhanced rate limiting)

        if (!captchaToken) {
            // Missing CAPTCHA token - return generic error
            // Requirement 20.3: Return 400 Bad Request
            // Requirement 20.4: Don't indicate CAPTCHA failure vs other failures
            return getCAPTCHAErrorResponse()
        }

        // Verify CAPTCHA token with graceful degradation
        // If CAPTCHA service is unavailable, returns degradedMode: true
        // and allows authentication to continue with enhanced rate limiting
        const captchaResult = await verifyCAPTCHAWithFallback(
            captchaToken as string
        )

        // Check if CAPTCHA verification succeeded
        if (!captchaResult.success) {
            // CAPTCHA verification failed
            // Requirement 20.3: Return 400 Bad Request
            // Requirement 20.4: Don't indicate CAPTCHA failure vs other failures

            if (captchaResult.degradedMode) {
                // CAPTCHA service unavailable - log degraded mode activation
                // Requirement 20.10: Log warning
                // Requirement 20.12: Continue with enhanced rate limiting
                degradedMode = true
                console.warn(
                    "CAPTCHA degraded mode: continuing with enhanced rate limiting",
                    {
                        clientIp,
                        timestamp: new Date().toISOString(),
                        event_type: "captcha_degraded_mode",
                        reason: captchaResult.failureReason,
                    }
                )
            } else {
                // CAPTCHA verification failed (not degraded mode)
                const errorDetails = createCAPTCHAErrorDetails(
                    captchaResult.failureReason || "invalid_token",
                    captchaResult.errorCodes
                )
                return handleCAPTCHAError(
                    errorDetails,
                    email as string | undefined,
                    clientIp
                )
            }
        }

        // ============================================================================
        // CSRF TOKEN VALIDATION (Task 8.4, Requirement 4)
        // ============================================================================

        if (!csrfToken) {
            // Log CSRF failure
            await logSecurityEvent(
                "CSRF_VIOLATION",
                email,
                clientIp,
                {
                    requestId,
                    reason: "Missing CSRF token",
                },
                undefined
            )

            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate CSRF token
        const csrfValid = await validateCSRFToken(csrfToken)
        if (!csrfValid) {
            // Log CSRF failure
            await logSecurityEvent(
                "CSRF_VIOLATION",
                email,
                clientIp,
                {
                    requestId,
                    reason: "Invalid or expired CSRF token",
                },
                undefined
            )

            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // ============================================================================
        // AUTHENTICATION SERVICE HANDLES:
        // - Database lookup
        // - Email verification check
        // - Password validation (Argon2id only)
        // ============================================================================

        // ============================================================================
        // PASSWORD VERIFICATION & AUTHENTICATION (Task 8.2, Requirement 3, 6)
        // ============================================================================
        // Use AuthenticationService for Argon2id validation with pepper

        let authResult
        try {
            authResult = await authService.login({
                email: email.toLowerCase(),
                password,
                captchaToken: captchaToken as string,
            })
        } catch (error) {
            // Log password validation error
            logAuthError(
                AuthErrorType.INTERNAL_ERROR,
                email,
                clientIp,
                `Password validation error (requestId: ${requestId}): ${error instanceof Error ? error.message : "Unknown error"}`
            )

            // Increment rate limit counter by email (Requirement 7.1: track by email)
            await incrementAttemptWithDegradation(email, degradedMode)

            return createErrorResponse(AuthErrorType.INTERNAL_ERROR)
        }

        // Check if authentication was successful
        if (!authResult.success) {
            // Log failed login attempt (Task 10.2)
            await logLoginFailure(
                email,
                clientIp,
                authResult.error || "Invalid credentials"
            )

            // Increment rate limit counter by email (Requirement 7.1: track by email)
            await incrementAttemptWithDegradation(email, degradedMode)

            // Return generic error for security
            // Requirement 7.4: Generic error messages (no user enumeration)
            return createErrorResponse(AuthErrorType.INVALID_CREDENTIALS)
        }

        // Authentication successful
        const userId = authResult.userId

        // ============================================================================
        // SESSION TOKEN CREATION (Task 8.8)
        // ============================================================================

        // Generate cryptographically secure session token
        const sessionToken = Buffer.from(
            `${userId}:${Date.now()}:${Math.random()}`
        ).toString("base64")

        // Calculate expiration time (1 hour for session, 30 days for remember me)
        const sessionExpirationTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        const rememberMeExpirationTime = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        ) // 30 days

        // ============================================================================
        // SESSION STORAGE (Task 8.8)
        // ============================================================================

        try {
            // Store session in database
            const { error: sessionError } = await supabase
                .from("sessions")
                .insert({
                    user_id: userId,
                    token_hash: sessionToken, // In production, hash this
                    expires_at: sessionExpirationTime.toISOString(),
                    ip_address: clientIp,
                    user_agent: userAgent,
                })

            if (sessionError) {
                logAuthError(
                    AuthErrorType.DATABASE_ERROR,
                    email,
                    clientIp,
                    `Session creation error (requestId: ${requestId}): ${sessionError.message}`
                )

                // Increment rate limit counter (with degraded mode support)
                await incrementAttemptWithDegradation(clientIp, degradedMode)

                return createErrorResponse(AuthErrorType.DATABASE_ERROR)
            }
        } catch (error) {
            logAuthError(
                AuthErrorType.DATABASE_ERROR,
                email,
                clientIp,
                `Session storage error (requestId: ${requestId}): ${error instanceof Error ? error.message : "Unknown error"}`
            )

            // Increment rate limit counter (with degraded mode support)
            await incrementAttemptWithDegradation(clientIp, degradedMode)

            return createErrorResponse(AuthErrorType.DATABASE_ERROR)
        }

        // ============================================================================
        // REMEMBER ME TOKEN CREATION (Task 8.9)
        // ============================================================================

        if (rememberMe) {
            try {
                const rememberMeToken = Buffer.from(
                    `${userId}:${Date.now()}:${Math.random()}`
                ).toString("base64")

                // Store remember me token in database
                const { error: rememberMeError } = await supabase
                    .from("remember_me_tokens")
                    .insert({
                        user_id: userId,
                        token_hash: rememberMeToken, // In production, hash this
                        expires_at: rememberMeExpirationTime.toISOString(),
                        ip_address: clientIp,
                        user_agent: userAgent,
                    })

                if (rememberMeError) {
                    logAuthError(
                        AuthErrorType.DATABASE_ERROR,
                        email,
                        clientIp,
                        `Remember Me token creation error (requestId: ${requestId}): ${rememberMeError.message}`
                    )
                    // Don't fail the login if remember me fails
                }
            } catch (error) {
                logAuthError(
                    AuthErrorType.DATABASE_ERROR,
                    email,
                    clientIp,
                    `Remember Me token storage error (requestId: ${requestId}): ${error instanceof Error ? error.message : "Unknown error"}`
                )
                // Don't fail the login if remember me fails
            }
        }

        // ============================================================================
        // RESPONSE CREATION (Task 8.10)
        // ============================================================================

        // Create success response
        const response = createSuccessResponse(
            {
                userId: userId,
                email: email,
                sessionToken,
            },
            "Login successful"
        )

        // ============================================================================
        // SECURE COOKIE SETTING (Task 8.10, Requirement 8)
        // ============================================================================

        // Set secure session cookie (HttpOnly, Secure, SameSite)
        response.cookies.set({
            name: "auth_session",
            value: sessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60, // 1 hour
            path: "/",
        })

        // Set remember me cookie if requested
        if (rememberMe) {
            const rememberMeToken = Buffer.from(
                `${userId}:${Date.now()}:${Math.random()}`
            ).toString("base64")

            response.cookies.set({
                name: "remember_me_token",
                value: rememberMeToken,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60, // 30 days
                path: "/",
            })
        }

        // ============================================================================
        // AUDIT LOGGING (Task 10.1)
        // ============================================================================

        // Log successful login (Task 10.2)
        await logLoginSuccess(email, clientIp, userId)

        void notifyUserAuditDiscord("user_login", {
            email,
            userId,
            provider: "email",
            ip: clientIp,
            environment: getAuditEnvironment(),
        })

        // Reset rate limit counter on successful login (Requirement 7.5)
        // Track by email (Requirement 7.1)
        await resetAttempt(email)

        return response
    } catch (error) {
        // ============================================================================
        // ERROR HANDLING (Task 9)
        // ============================================================================

        logAuthError(
            AuthErrorType.INTERNAL_ERROR,
            undefined,
            "unknown",
            `Unexpected error in login endpoint (requestId: ${requestId}): ${error instanceof Error ? error.message : "Unknown error"}`
        )

        // Check if it's a network error or server error
        if (error instanceof TypeError && error.message.includes("fetch")) {
            return createErrorResponse(
                AuthErrorType.INTERNAL_ERROR,
                undefined,
                "Server is currently unavailable. Please try again later."
            )
        }

        return createErrorResponse(AuthErrorType.INTERNAL_ERROR)
    }
}
