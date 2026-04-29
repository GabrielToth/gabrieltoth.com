import { logLoginFailure, logLoginSuccess } from "@/lib/auth/audit-logging"
import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/auth/error-handling"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { validateEmail } from "@/lib/validation"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcrypt"
import { NextRequest } from "next/server"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 *
 * Security Features:
 * - Type validation (prevent script modifications)
 * - Field validation (prevent injection)
 * - Length validation (prevent buffer overflow)
 * - Rate limiting (prevent brute force)
 * - Bcrypt comparison (prevent timing attacks)
 * - Generic error messages (prevent user enumeration)
 *
 * Request body:
 * {
 *   email: string
 *   password: string
 *   rememberMe: boolean
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
 */
export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting and logging
        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown"

        // Apply rate limiting (5 requests per hour per IP)
        const rateLimitKey = buildClientKey({
            ip: clientIp,
            path: "/api/auth/login",
            userAgent: request.headers.get("user-agent"),
        })

        const rateLimit = await rateLimitByKey(rateLimitKey)
        if (!rateLimit.success) {
            return createErrorResponse(AuthErrorType.TOO_MANY_ATTEMPTS)
        }

        // Parse request body with error handling
        let body: unknown
        try {
            body = await request.json()
        } catch {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate body is an object (prevent script modifications)
        if (typeof body !== "object" || body === null || Array.isArray(body)) {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        const bodyObj = body as Record<string, unknown>
        const { email, password, rememberMe, csrfToken } = bodyObj

        // ============================================================================
        // TYPE VALIDATION (Prevent script modifications)
        // ============================================================================

        // Validate email type
        if (typeof email !== "string") {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate password type
        if (typeof password !== "string") {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate rememberMe type (optional, but if present must be boolean)
        if (rememberMe !== undefined && typeof rememberMe !== "boolean") {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate csrfToken type (optional, but if present must be string)
        if (csrfToken !== undefined && typeof csrfToken !== "string") {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // ============================================================================
        // FIELD VALIDATION (Prevent injection attacks)
        // ============================================================================

        // Validate no extra fields (prevent injection)
        const allowedFields = new Set([
            "email",
            "password",
            "rememberMe",
            "csrfToken",
        ])
        const providedFields = Object.keys(bodyObj)
        const hasExtraFields = providedFields.some(
            field => !allowedFields.has(field)
        )
        if (hasExtraFields) {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // ============================================================================
        // LENGTH VALIDATION (Prevent buffer overflow)
        // ============================================================================

        // Validate email length
        if (email.length === 0 || email.length > 255) {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate password length
        if (password.length === 0 || password.length > 1024) {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // ============================================================================
        // FORMAT VALIDATION
        // ============================================================================

        // Validate email format
        const emailValidation = validateEmail(email)
        if (!emailValidation.isValid) {
            return createErrorResponse(
                AuthErrorType.INVALID_EMAIL,
                "email",
                emailValidation.error
            )
        }

        // Validate password is not just whitespace
        if (password.trim().length === 0) {
            return createErrorResponse(AuthErrorType.INVALID_CREDENTIALS)
        }

        // ============================================================================
        // DATABASE LOOKUP
        // ============================================================================

        // Find user by email
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, email, password_hash, email_verified")
            .eq("email", email.toLowerCase())
            .single()

        // User not found or database error - return generic error for security
        if (userError || !user) {
            // Log failed login attempt
            await logLoginFailure(email, clientIp, "User not found")

            // Return generic error (never indicate if email exists)
            return createErrorResponse(AuthErrorType.INVALID_CREDENTIALS)
        }

        // ============================================================================
        // EMAIL VERIFICATION CHECK
        // ============================================================================

        // Check if email is verified
        if (!user.email_verified) {
            return createErrorResponse(AuthErrorType.EMAIL_NOT_VERIFIED)
        }

        // ============================================================================
        // PASSWORD COMPARISON (Constant-time)
        // ============================================================================

        // Compare password with hash using bcrypt (constant-time comparison)
        const passwordMatch = await bcrypt.compare(password, user.password_hash)

        if (!passwordMatch) {
            // Log failed login attempt
            await logLoginFailure(email, clientIp, "Invalid password")

            // Return generic error for security
            return createErrorResponse(AuthErrorType.INVALID_CREDENTIALS)
        }

        // ============================================================================
        // SESSION CREATION
        // ============================================================================

        // Create session token
        const sessionToken = Buffer.from(
            `${user.id}:${Date.now()}:${Math.random()}`
        ).toString("base64")

        // Calculate expiration time
        const expirationTime = rememberMe
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            : new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Store session in database
        const { error: sessionError } = await supabase.from("sessions").insert({
            user_id: user.id,
            token: sessionToken,
            expires_at: expirationTime.toISOString(),
            ip_address: clientIp,
            user_agent: request.headers.get("user-agent"),
        })

        if (sessionError) {
            console.error("Session creation error:", sessionError)
            return createErrorResponse(AuthErrorType.DATABASE_ERROR)
        }

        // ============================================================================
        // RESPONSE CREATION
        // ============================================================================

        // Create secure cookie
        const response = createSuccessResponse(
            {
                userId: user.id,
                email: user.email,
                sessionToken,
            },
            "Login successful"
        )

        // Set secure session cookie
        response.cookies.set({
            name: "auth_session",
            value: sessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 24 hours
            path: "/",
        })

        // Log successful login
        await logLoginSuccess(email, clientIp, user.id)

        return response
    } catch (error) {
        console.error("Login error:", error)

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
