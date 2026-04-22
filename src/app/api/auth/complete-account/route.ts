/**
 * Account Completion API Endpoint
 *
 * POST /api/auth/complete-account
 *
 * Processes and persists account completion data for legacy OAuth users.
 * Validates all submitted data, updates user record, and creates a session.
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

import { validateAccountCompletionData } from "@/lib/auth/account-completion-validation"
import { logAuditEvent } from "@/lib/auth/audit-logging"
import {
    AuthErrorType,
    createErrorResponse,
    logAuthError,
} from "@/lib/auth/error-handling"
import { createSession } from "@/lib/auth/session"
import { validateTempToken } from "@/lib/auth/temp-token"
import { getUserByEmail, updateUserAccountCompletion } from "@/lib/auth/user"
import { logger } from "@/lib/logger"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import bcrypt from "bcrypt"
import { NextRequest, NextResponse } from "next/server"

const BCRYPT_COST_FACTOR = parseInt(process.env.BCRYPT_COST_FACTOR || "12")

/**
 * Request body for account completion
 */
interface CompleteAccountRequest {
    tempToken: string
    email: string
    name: string
    password: string
    phone: string
    birthDate: string
}

/**
 * Response for successful account completion
 */
interface CompleteAccountResponse {
    success: true
    message: string
    redirectUrl: string
}

/**
 * POST /api/auth/complete-account
 *
 * Handles account completion for legacy OAuth users.
 *
 * Process:
 * 1. Validate temp token
 * 2. Validate all submitted data
 * 3. Check email uniqueness
 * 4. Hash password
 * 5. Update user record
 * 6. Create session
 * 7. Return success response with session cookie
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
export async function POST(
    request: NextRequest
): Promise<
    NextResponse<
        | CompleteAccountResponse
        | { success: false; error: string; field?: string }
    >
> {
    const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "unknown"

    try {
        // Apply rate limiting (5 requests per hour per IP)
        const rateLimitKey = buildClientKey({
            ip: clientIp,
            path: "/api/auth/complete-account",
            userAgent: request.headers.get("user-agent"),
        })

        const rateLimit = await rateLimitByKey(rateLimitKey)
        if (!rateLimit.success) {
            logAuthError(
                AuthErrorType.TOO_MANY_ATTEMPTS,
                undefined,
                clientIp,
                "CompleteAccount"
            )
            return createErrorResponse(AuthErrorType.TOO_MANY_ATTEMPTS)
        }

        // Parse request body
        const body = (await request.json()) as CompleteAccountRequest

        // Validate temp token
        let tokenPayload
        try {
            tokenPayload = validateTempToken(body.tempToken)
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Invalid token"
            logAuthError(
                AuthErrorType.INVALID_TOKEN,
                body.email,
                clientIp,
                "CompleteAccount"
            )
            logger.warn("Invalid temp token", {
                context: "CompleteAccount",
                data: { error: errorMessage },
            })
            return createErrorResponse(
                AuthErrorType.INVALID_TOKEN,
                undefined,
                "Your session has expired. Please log in again"
            )
        }

        // Validate all submitted data
        const validation = validateAccountCompletionData({
            email: body.email,
            name: body.name,
            password: body.password,
            phone: body.phone,
            birthDate: body.birthDate,
        })

        if (!validation.valid) {
            // Return first validation error
            const firstErrorField = Object.keys(validation.errors)[0]
            const firstErrorMessage = validation.errors[firstErrorField]

            logger.warn("Account completion validation failed", {
                context: "CompleteAccount",
                data: {
                    email: body.email,
                    errors: validation.errors,
                },
            })

            return createErrorResponse(
                AuthErrorType.INVALID_INPUT,
                firstErrorField,
                firstErrorMessage
            )
        }

        // Check if email is already registered (and not the same as OAuth email)
        if (body.email !== tokenPayload.email) {
            const existingUser = await getUserByEmail(body.email)
            if (existingUser) {
                logAuthError(
                    AuthErrorType.EMAIL_ALREADY_REGISTERED,
                    body.email,
                    clientIp,
                    "CompleteAccount"
                )
                logger.warn("Email already registered", {
                    context: "CompleteAccount",
                    data: { email: body.email },
                })
                return createErrorResponse(
                    AuthErrorType.EMAIL_ALREADY_REGISTERED,
                    "email",
                    "This email is already in use"
                )
            }
        }

        // Hash password
        let passwordHash: string
        try {
            passwordHash = await bcrypt.hash(body.password, BCRYPT_COST_FACTOR)
        } catch (error) {
            logger.error("Password hashing failed", {
                context: "CompleteAccount",
                error: error as Error,
            })
            return createErrorResponse(AuthErrorType.INTERNAL_ERROR)
        }

        // Update user record with account completion data
        let updatedUser
        try {
            updatedUser = await updateUserAccountCompletion(
                tokenPayload.oauth_id,
                {
                    email: body.email,
                    name: body.name,
                    password_hash: passwordHash,
                    phone_number: body.phone,
                    birth_date: new Date(body.birthDate),
                    account_completion_status: "completed",
                    account_completed_at: new Date(),
                }
            )
        } catch (error) {
            logger.error("Failed to update user account completion", {
                context: "CompleteAccount",
                error: error as Error,
                data: { email: body.email },
            })
            return createErrorResponse(AuthErrorType.DATABASE_ERROR)
        }

        // Create session
        let session
        try {
            session = await createSession(updatedUser.id)
        } catch (error) {
            logger.error("Failed to create session", {
                context: "CompleteAccount",
                error: error as Error,
                data: { userId: updatedUser.id },
            })
            return createErrorResponse(AuthErrorType.DATABASE_ERROR)
        }

        // Log account completion event
        await logAuditEvent(
            "ACCOUNT_COMPLETION",
            body.email,
            clientIp,
            {
                action: "Account completed",
                oauth_provider: tokenPayload.oauth_provider,
            },
            updatedUser.id
        )

        logger.info("Account completion successful", {
            context: "CompleteAccount",
            data: {
                userId: updatedUser.id,
                email: body.email,
            },
        })

        // Create response with session cookie
        const response = NextResponse.json(
            {
                success: true,
                message: "Account setup completed successfully",
                redirectUrl: "/dashboard",
            } as CompleteAccountResponse,
            { status: 200 }
        )

        // Set session cookie (HTTP-only, secure, SameSite=Strict)
        response.cookies.set("session", session.session_id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
            path: "/",
        })

        return response
    } catch (error) {
        logger.error("Unexpected error in account completion", {
            context: "CompleteAccount",
            error: error as Error,
            data: { clientIp },
        })
        return createErrorResponse(AuthErrorType.INTERNAL_ERROR)
    }
}
