import { sendPasswordResetEmail } from "@/lib/auth/email-service"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/auth/test-email
 *
 * Test endpoint to verify email sending is working
 * ONLY for development/testing - should be removed in production
 *
 * Body:
 * - email: string (required)
 * - locale: string (optional, default: "en")
 *
 * Returns:
 * - 200: Email sent successfully
 * - 400: Invalid request
 * - 500: Email sending failed
 */
export async function POST(request: NextRequest) {
    try {
        // Security: Only allow in development or with special header
        const isProduction = process.env.NODE_ENV === "production"
        const authToken = request.headers.get("x-test-token")

        if (isProduction && authToken !== process.env.TEST_EMAIL_TOKEN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { email, locale = "en" } = body

        // Validate email
        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            )
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            )
        }

        // Generate a test reset link
        const resetToken = "test-token-" + crypto.randomUUID()
        const resetLink = `https://www.gabrieltoth.com/${locale}/reset-password?token=${resetToken}`

        console.log(`[TEST EMAIL] Sending test email to: ${email}`)
        console.log(`[TEST EMAIL] Reset link: ${resetLink}`)

        // Send test email
        const emailSent = await sendPasswordResetEmail(email, resetLink, locale)

        if (!emailSent) {
            console.error(`[TEST EMAIL] Failed to send email to: ${email}`)
            return NextResponse.json(
                {
                    error: "Failed to send test email",
                    details: "Check Resend API key and domain verification",
                },
                { status: 500 }
            )
        }

        console.log(`[TEST EMAIL] Email sent successfully to: ${email}`)

        return NextResponse.json({
            success: true,
            message: "Test email sent successfully",
            details: {
                email,
                locale,
                resetLink,
                timestamp: new Date().toISOString(),
            },
        })
    } catch (error) {
        console.error("[TEST EMAIL] Error:", error)
        return NextResponse.json(
            {
                error: "An unexpected error occurred",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
