import {
    getAuditEnvironment,
    notifyUserAuditDiscord,
} from "@/lib/audit/discord-user-audit"
import { logRegistration } from "@/lib/auth/audit-logging"
import { AuthErrorType, createErrorResponse } from "@/lib/auth/error-handling"
import { AuthenticationService } from "@/lib/auth/password-security"
import { generateTempToken } from "@/lib/auth/temp-token"
import {
    validateBirthDateFormat,
    validateEmail,
    validateMinimumAge,
    validateName,
    validatePassword,
    validatePhoneNumber,
} from "@/lib/validation"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize authentication service for password security
const authService = new AuthenticationService()

export async function POST(request: NextRequest) {
    try {
        // ============================================================================
        // REQUEST BODY PARSING (Task 8.3)
        // ============================================================================

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
        const {
            email,
            password,
            name,
            phone,
            full_name,
            birth_date,
            auth_method,
            captchaToken,
        } = bodyObj

        // ============================================================================
        // TYPE VALIDATION (Prevent script modifications)
        // ============================================================================

        // Validate required field types
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof name !== "string" ||
            typeof phone !== "string"
        ) {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate optional field types
        if (full_name !== undefined && typeof full_name !== "string") {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        if (birth_date !== undefined && typeof birth_date !== "string") {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        if (auth_method !== undefined && typeof auth_method !== "string") {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        if (captchaToken !== undefined && typeof captchaToken !== "string") {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // ============================================================================
        // FIELD VALIDATION (Prevent injection attacks)
        // ============================================================================

        // Validate no extra fields (prevent injection)
        const allowedFields = new Set([
            "email",
            "password",
            "name",
            "phone",
            "full_name",
            "birth_date",
            "auth_method",
            "csrfToken",
            "captchaToken",
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

        // Validate field lengths
        if (email.length === 0 || email.length > 255) {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        if (password.length === 0 || password.length > 1024) {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        if (name.length === 0 || name.length > 255) {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        if (phone.length === 0 || phone.length > 20) {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        if (birth_date && birth_date.length > 10) {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }

        // Validate all parameters
        if (!email || !password || !name || !phone) {
            return createErrorResponse(AuthErrorType.REQUIRED_FIELD_EMPTY)
        }

        // Validate email format
        const emailValidation = validateEmail(email)
        if (!emailValidation.isValid) {
            return createErrorResponse(
                AuthErrorType.INVALID_EMAIL,
                "email",
                emailValidation.error
            )
        }

        // Validate password
        const passwordValidation = validatePassword(password)
        if (!passwordValidation.isValid) {
            return createErrorResponse(
                AuthErrorType.INVALID_PASSWORD,
                "password",
                passwordValidation.error
            )
        }

        // Validate name
        const nameValidation = validateName(name)
        if (!nameValidation.isValid) {
            return createErrorResponse(
                AuthErrorType.INVALID_NAME,
                "name",
                nameValidation.error
            )
        }
        // Validate phone
        const phoneValidation = validatePhoneNumber(phone)
        if (!phoneValidation.isValid) {
            return createErrorResponse(
                AuthErrorType.INVALID_INPUT,
                "phone",
                phoneValidation.error
            )
        }

        // Validate birth_date if provided
        if (birth_date) {
            const birthDateFormatValidation =
                validateBirthDateFormat(birth_date)
            if (!birthDateFormatValidation.isValid) {
                return createErrorResponse(
                    AuthErrorType.INVALID_INPUT,
                    "birth_date",
                    birthDateFormatValidation.error
                )
            }

            const ageValidation = validateMinimumAge(birth_date)
            if (!ageValidation.isValid) {
                return createErrorResponse(
                    AuthErrorType.INVALID_INPUT,
                    "birth_date",
                    ageValidation.error
                )
            }
        }

        // ============================================================================
        // USE AUTHENTICATION SERVICE FOR REGISTRATION (Task 8.3)
        // ============================================================================
        // The AuthenticationService handles:
        // - CAPTCHA validation (Requirement 20.1, 20.2, 20.3, 20.4)
        // - Input validation (Requirement 8.1, 8.2, 8.3, 8.6)
        // - Email existence check (Requirement 8.6)
        // - Argon2id password hashing (Requirement 1.1, 1.2, 1.3)
        // - User record creation (Requirement 1.1, 5.5)
        // - Audit logging (Requirement 14.1, 14.3)
        // - Generic error messages (Requirement 7.4)

        const authResult = await authService.register({
            email: email.toLowerCase(),
            password,
            captchaToken: captchaToken as string | undefined,
        })

        // Handle authentication service errors
        if (!authResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: authResult.error || "Registration failed",
                    errorCode: authResult.errorCode,
                },
                { status: authResult.statusCode }
            )
        }

        // ============================================================================
        // REGISTRATION SUCCESSFUL - CREATE SESSION
        // ============================================================================

        // Generate temporary token for session creation
        const tempToken = generateTempToken({
            email: email.toLowerCase(),
            oauth_provider: "email",
            oauth_id: email.toLowerCase(),
            name,
            picture: undefined,
        })

        // Get client IP for logging
        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown"

        // Log registration completion
        await logRegistration(email, clientIp, authResult.userId!)

        void notifyUserAuditDiscord("user_registered", {
            email: email.toLowerCase(),
            userId: authResult.userId,
            provider: "email",
            ip: clientIp,
            environment: getAuditEnvironment(),
        })

        return NextResponse.json(
            {
                success: true,
                message:
                    "Account created successfully. Proceeding to dashboard.",
                data: {
                    userId: authResult.userId,
                    email: email.toLowerCase(),
                    tempToken,
                    redirectUrl: `/auth/complete-account?token=${encodeURIComponent(tempToken)}`,
                },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Registration error:", error)
        return createErrorResponse(AuthErrorType.INTERNAL_ERROR)
    }
}
