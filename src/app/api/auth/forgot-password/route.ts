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
                `[FORGOT PASSWORD] Password reset requested for non-existent email: ${email}`
            )
            return NextResponse.json({
                success: true,
                message:
                    "Se uma conta estiver vinculada a este email, você receberá um link para redefinir sua senha.",
            })
        }

        console.log(
            `[FORGOT PASSWORD] User found for email: ${email}, user_id: ${user.id}`
        )

        // Generate password reset token using Supabase Auth
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            email,
            {
                redirectTo: `${request.nextUrl.origin}/${locale}/reset-password`,
            }
        )

        if (resetError) {
            console.error(
                `[FORGOT PASSWORD] Supabase password reset error for ${email}:`,
                resetError
            )

            // Fallback: Try sending email directly with Resend
            const resetToken = crypto.randomUUID()
            const resetLink = `${request.nextUrl.origin}/${locale}/reset-password?token=${resetToken}`

            console.log(
                `[FORGOT PASSWORD] Using Resend fallback for ${email}, token: ${resetToken.substring(0, 8)}...`
            )

            // Store token in database
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

            const { error: tokenError } = await supabase
                .from("password_reset_tokens")
                .insert({
                    user_id: user.id,
                    token: resetToken,
                    expires_at: expiresAt.toISOString(),
                })

            if (tokenError) {
                console.error(
                    `[FORGOT PASSWORD] Failed to store reset token for ${email}:`,
                    tokenError
                )
                return NextResponse.json(
                    { error: "Failed to process password reset request" },
                    { status: 500 }
                )
            }

            console.log(
                `[FORGOT PASSWORD] Reset token stored for ${email}, expires at: ${expiresAt.toISOString()}`
            )

            // Send email with Resend
            const emailSent = await sendPasswordResetEmail(
                email,
                resetLink,
                locale
            )

            if (!emailSent) {
                console.error(
                    `[FORGOT PASSWORD] Failed to send password reset email to ${email}`
                )
                return NextResponse.json(
                    { error: "Failed to send password reset email" },
                    { status: 500 }
                )
            }

            console.log(
                `[FORGOT PASSWORD] Password reset email sent successfully to: ${email}`
            )
        } else {
            console.log(
                `[FORGOT PASSWORD] Supabase password reset initiated for: ${email}`
            )
        }

        // Always return success (don't reveal if email exists)
        return NextResponse.json({
            success: true,
            message:
                "Se uma conta estiver vinculada a este email, você receberá um link para redefinir sua senha.",
        })
    } catch (error) {
        console.error("[FORGOT PASSWORD] Unexpected error:", error)
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
