/**
 * Registration Session Management API Endpoint
 * Handles creation, validation, and management of registration sessions
 *
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.6
 */

import {
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/auth/error-handling"
import {
    createRegistrationSession,
    removeRegistrationSession,
    updateRegistrationSession,
    validateRegistrationSession,
} from "@/lib/auth/registration-session"
import { validateEmail } from "@/lib/validation"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE_NAME = "registration_session_id"
const SESSION_COOKIE_MAX_AGE = 30 * 60 // 30 minutes in seconds

/**
 * POST /api/auth/registration-session
 * Create a new registration session
 *
 * Request body:
 * {
 *   email: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     sessionId: string,
 *     expiresAt: ISO8601 timestamp
 *   }
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email } = body

        // Validate email
        if (!email) {
            return NextResponse.json(
                createErrorResponse(
                    "MISSING_EMAIL",
                    "Email is required to create a registration session"
                ),
                { status: 400 }
            )
        }

        const emailValidation = validateEmail(email)
        if (!emailValidation.isValid) {
            return NextResponse.json(
                createErrorResponse("INVALID_EMAIL", "Invalid email format"),
                { status: 400 }
            )
        }

        // Create registration session
        const session = await createRegistrationSession(email)

        // Set HTTP-only cookie with session ID
        const cookieStore = await cookies()
        cookieStore.set(SESSION_COOKIE_NAME, session.session_id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: SESSION_COOKIE_MAX_AGE,
            path: "/",
        })

        return NextResponse.json(
            createSuccessResponse({
                sessionId: session.session_id,
                expiresAt: session.expires_at.toISOString(),
            }),
            { status: 201 }
        )
    } catch (error) {
        console.error("Registration session creation error:", error)
        return NextResponse.json(
            createErrorResponse(
                "INTERNAL_ERROR",
                "Failed to create registration session"
            ),
            { status: 500 }
        )
    }
}

/**
 * GET /api/auth/registration-session
 * Validate and retrieve current registration session
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     sessionId: string,
 *     email: string,
 *     currentStep: number,
 *     expiresAt: ISO8601 timestamp
 *   }
 * }
 *
 * or
 *
 * {
 *   success: false,
 *   error: "SESSION_EXPIRED" | "SESSION_NOT_FOUND"
 * }
 */
export async function GET(request: NextRequest) {
    try {
        // Get session ID from HTTP-only cookie
        const cookieStore = await cookies()
        const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

        if (!sessionId) {
            return NextResponse.json(
                createErrorResponse(
                    "SESSION_NOT_FOUND",
                    "No active registration session"
                ),
                { status: 404 }
            )
        }

        // Validate session
        const session = await validateRegistrationSession(sessionId)

        if (!session) {
            // Clear expired session cookie
            const cookieStore = await cookies()
            cookieStore.delete(SESSION_COOKIE_NAME)

            return NextResponse.json(
                createErrorResponse(
                    "SESSION_EXPIRED",
                    "Registration session has expired"
                ),
                { status: 401 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                sessionId: session.session_id,
                email: session.email,
                name: session.name,
                phone: session.phone,
                currentStep: session.current_step,
                expiresAt: session.expires_at.toISOString(),
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error("Registration session validation error:", error)
        return NextResponse.json(
            createErrorResponse(
                "INTERNAL_ERROR",
                "Failed to validate registration session"
            ),
            { status: 500 }
        )
    }
}

/**
 * PUT /api/auth/registration-session
 * Update registration session with form data
 *
 * Request body:
 * {
 *   email?: string,
 *   name?: string,
 *   phone?: string,
 *   currentStep?: number
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     sessionId: string,
 *     expiresAt: ISO8601 timestamp
 *   }
 * }
 */
export async function PUT(request: NextRequest) {
    try {
        // Get session ID from HTTP-only cookie
        const cookieStore = await cookies()
        const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

        if (!sessionId) {
            return NextResponse.json(
                createErrorResponse(
                    "SESSION_NOT_FOUND",
                    "No active registration session"
                ),
                { status: 404 }
            )
        }

        // Validate session exists
        const session = await validateRegistrationSession(sessionId)
        if (!session) {
            const cookieStore = await cookies()
            cookieStore.delete(SESSION_COOKIE_NAME)

            return NextResponse.json(
                createErrorResponse(
                    "SESSION_EXPIRED",
                    "Registration session has expired"
                ),
                { status: 401 }
            )
        }

        // Get update data
        const body = await request.json()
        const { email, name, phone, currentStep } = body

        // Update session
        const updatedSession = await updateRegistrationSession(sessionId, {
            email,
            name,
            phone,
            current_step: currentStep as 1 | 2 | 3 | 4 | undefined,
        })

        // Extend cookie expiration
        const cookieStore2 = await cookies()
        cookieStore2.set(SESSION_COOKIE_NAME, sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: SESSION_COOKIE_MAX_AGE,
            path: "/",
        })

        return NextResponse.json(
            createSuccessResponse({
                sessionId: updatedSession.session_id,
                expiresAt: updatedSession.expires_at.toISOString(),
            }),
            { status: 200 }
        )
    } catch (error) {
        console.error("Registration session update error:", error)
        return NextResponse.json(
            createErrorResponse(
                "INTERNAL_ERROR",
                "Failed to update registration session"
            ),
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/auth/registration-session
 * Remove registration session
 *
 * Response:
 * {
 *   success: true,
 *   message: "Registration session removed"
 * }
 */
export async function DELETE(request: NextRequest) {
    try {
        // Get session ID from HTTP-only cookie
        const cookieStore = await cookies()
        const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

        if (sessionId) {
            // Remove session from database
            await removeRegistrationSession(sessionId)
        }

        // Clear session cookie
        const cookieStore2 = await cookies()
        cookieStore2.delete(SESSION_COOKIE_NAME)

        return NextResponse.json(
            createSuccessResponse(
                { message: "Registration session removed" },
                "Registration session removed successfully"
            ),
            { status: 200 }
        )
    } catch (error) {
        console.error("Registration session removal error:", error)
        return NextResponse.json(
            createErrorResponse(
                "INTERNAL_ERROR",
                "Failed to remove registration session"
            ),
            { status: 500 }
        )
    }
}
