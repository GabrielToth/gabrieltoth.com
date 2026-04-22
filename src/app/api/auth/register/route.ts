import { logRegistration } from "@/lib/auth/audit-logging"
import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/auth/error-handling"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import {
    validateEmail,
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

        const body = await request.json()
        const { email, password, name, phone } = body

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
                hashed_password: hashedPassword,
                name,
                phone: phoneValidation.normalized || phone,
                email_verified: false,
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
