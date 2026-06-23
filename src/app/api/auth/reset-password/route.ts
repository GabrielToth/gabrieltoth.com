import { hashPassword } from "@/lib/auth/password-hashing"
import { getAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/auth/reset-password
 *
 * Reset password with token
 *
 * Body:
 * - token: string (required) - Reset token from email
 * - password: string (required) - New password
 * - confirmPassword: string (required) - Password confirmation
 *
 * Returns:
 * - 200: Password reset successful
 * - 400: Invalid request or validation error
 * - 401: Invalid or expired token
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { token, password, confirmPassword } = body

        // Validate required fields
        if (!token || typeof token !== "string") {
            return NextResponse.json(
                { error: "Reset token is required" },
                { status: 400 }
            )
        }

        if (!password || typeof password !== "string") {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            )
        }

        if (!confirmPassword || typeof confirmPassword !== "string") {
            return NextResponse.json(
                { error: "Password confirmation is required" },
                { status: 400 }
            )
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: "Passwords do not match" },
                { status: 400 }
            )
        }

        // Validate password strength
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                {
                    error: "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
                },
                { status: 400 }
            )
        }

        const supabase = getAdminClient()

        // Check if token exists and is valid
        const { data: resetToken, error: tokenError } = await supabase
            .from("password_reset_tokens")
            .select("*")
            .eq("token", token)
            .single()

        if (tokenError || !resetToken) {
            return NextResponse.json(
                { error: "Invalid or expired reset token" },
                { status: 401 }
            )
        }

        // Check if token is expired
        const now = new Date()
        const expiresAt = new Date(resetToken.expires_at)
        if (now > expiresAt) {
            // Delete expired token
            await supabase
                .from("password_reset_tokens")
                .delete()
                .eq("token", token)

            return NextResponse.json(
                { error: "Reset link has expired. Please request a new one." },
                { status: 401 }
            )
        }

        // Check if token was already used
        if (resetToken.used_at) {
            return NextResponse.json(
                { error: "This reset link has already been used" },
                { status: 401 }
            )
        }

        const hashedPassword = await hashPassword(password)

        // Update user password
        const { error: updateError } = await supabase
            .from("users")
            .update({
                password_hash: hashedPassword,
                updated_at: new Date().toISOString(),
            })
            .eq("id", resetToken.user_id)

        if (updateError) {
            console.error("Failed to update password:", updateError)
            return NextResponse.json(
                { error: "Failed to reset password" },
                { status: 500 }
            )
        }

        // Mark token as used
        await supabase
            .from("password_reset_tokens")
            .update({
                used_at: new Date().toISOString(),
            })
            .eq("token", token)

        // Invalidate all user sessions (force re-login)
        await supabase
            .from("sessions")
            .delete()
            .eq("user_id", resetToken.user_id)

        console.log(`Password reset successful for user: ${resetToken.user_id}`)

        return NextResponse.json({
            success: true,
            message:
                "Password reset successfully. Please log in with your new password.",
        })
    } catch (error) {
        console.error("Reset password error:", error)
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}

/**
 * GET /api/auth/reset-password?token=xxx
 *
 * Validate reset token
 *
 * Query params:
 * - token: string (required) - Reset token to validate
 *
 * Returns:
 * - 200: Token is valid
 * - 401: Invalid or expired token
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const token = searchParams.get("token")

        if (!token) {
            return NextResponse.json(
                { error: "Reset token is required" },
                { status: 400 }
            )
        }

        const supabase = getAdminClient()

        // Check if token exists and is valid
        const { data: resetToken, error: tokenError } = await supabase
            .from("password_reset_tokens")
            .select("*")
            .eq("token", token)
            .single()

        if (tokenError || !resetToken) {
            return NextResponse.json(
                { valid: false, error: "Invalid reset token" },
                { status: 401 }
            )
        }

        // Check if token is expired
        const now = new Date()
        const expiresAt = new Date(resetToken.expires_at)
        if (now > expiresAt) {
            return NextResponse.json(
                { valid: false, error: "Reset link has expired" },
                { status: 401 }
            )
        }

        // Check if token was already used
        if (resetToken.used_at) {
            return NextResponse.json(
                {
                    valid: false,
                    error: "This reset link has already been used",
                },
                { status: 401 }
            )
        }

        return NextResponse.json({
            valid: true,
            message: "Token is valid",
        })
    } catch (error) {
        console.error("Validate reset token error:", error)
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
