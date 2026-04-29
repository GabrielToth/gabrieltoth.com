import { logRegistration } from "@/lib/auth/audit-logging"
import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/auth/error-handling"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import {
    validateBirthDateFormat,
    validateEmail,
    validateMinimumAge,
    validateName,
    validatePassword,
    validatePhoneNumber,
} from "@/lib/validation"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcrypt"
import { NextRequest } from "next/server"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BCRYPT_COST_FACTOR = parseInt(process.env.BCRYPT_COST_FACTOR || "10")

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown"

        // Apply rate limiting (5 requests per hour per IP)
        const rateLimitKey = buildClientKey({
            ip: clientIp,
            path: "/api/auth/register",
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
        const {
            email,
            password,
            name,
            phone,
            full_name,
            birth_date,
            auth_method,
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

        // Check if email already exists
        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", email.toLowerCase())
            .single()

        if (existingUser) {
            return createErrorResponse(AuthErrorType.EMAIL_ALREADY_REGISTERED)
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, BCRYPT_COST_FACTOR)

        // Create user
        const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
                email: email.toLowerCase(),
                password_hash: hashedPassword,
                name,
                phone: phoneValidation.normalized || phone,
                birth_date: birth_date || null,
                email_verified: false,
                auth_method: "email",
            })
            .select("id")
            .single()

        if (createError || !newUser) {
            console.error("User creation error:", createError)
            return createErrorResponse(AuthErrorType.DATABASE_ERROR)
        }

        // Log registration event
        await logRegistration(email, clientIp, newUser.id)

        const response = createSuccessResponse(
            {
                userId: newUser.id,
                email: email.toLowerCase(),
            },
            "User registered successfully. Please verify your email."
        )
        // Override status to 201 Created
        response.status = 201
        return response
    } catch (error) {
        console.error("Registration error:", error)
        return createErrorResponse(AuthErrorType.INTERNAL_ERROR)
    }
}
