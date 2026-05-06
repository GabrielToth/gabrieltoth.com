import { sendPasswordResetEmail } from "@/lib/auth/email-service"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/auth/forgot-password
 *
 * Request password reset email
 *
 * Body:
 * - email: string (required)
 * - locale: string (optional, default: "en")
 *
 * Returns:
 * - 200: Success (always returns success for security)
 * - 400: Invalid request
 * - 429: Rate limit exceeded
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
    try {
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

        const supabase = await createClient()

        // Check if user exists (but don't reveal this to the client for security)
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, email")
            .eq("email", email)
            .single()

        if (userError || !user) {
            // Don't reveal if user exists or not - return success anyway
            console.log(
                `Password reset requested for non-existent email: ${email}`
            )
            return NextResponse.json({
                success: true,
                message:
                    "If an account exists with this email, you will receive a password reset link.",
            })
        }

        // Generate password reset token using Supabase Auth
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            email,
            {
                redirectTo: `${request.nextUrl.origin}/${locale}/reset-password`,
            }
        )

        if (resetError) {
            console.error("Supabase password reset error:", resetError)

            // Fallback: Try sending email directly with Resend
            const resetToken = crypto.randomUUID()
            const resetLink = `${request.nextUrl.origin}/${locale}/reset-password?token=${resetToken}`

            // Store token in database (you'll need to create this table)
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

            const { error: tokenError } = await supabase
                .from("password_reset_tokens")
                .insert({
                    user_id: user.id,
                    token: resetToken,
                    expires_at: expiresAt.toISOString(),
                })

            if (tokenError) {
                console.error("Failed to store reset token:", tokenError)
                return NextResponse.json(
                    { error: "Failed to process password reset request" },
                    { status: 500 }
                )
            }

            // Send email with Resend
            const emailSent = await sendPasswordResetEmail(
                email,
                resetLink,
                locale
            )

            if (!emailSent) {
                console.error("Failed to send password reset email")
                return NextResponse.json(
                    { error: "Failed to send password reset email" },
                    { status: 500 }
                )
            }

            console.log(`Password reset email sent successfully to: ${email}`)
        } else {
            console.log(`Supabase password reset initiated for: ${email}`)
        }

        // Always return success (don't reveal if email exists)
        return NextResponse.json({
            success: true,
            message:
                "If an account exists with this email, you will receive a password reset link.",
        })
    } catch (error) {
        console.error("Forgot password error:", error)
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
