import { logEmailVerification } from "@/lib/auth/audit-logging"
import { sendVerificationEmail } from "@/lib/auth/email-service"
import { getAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const supabase = getAdminClient()

const VERIFICATION_TOKEN_EXPIRY = parseInt(
    process.env.VERIFICATION_TOKEN_EXPIRY || "86400000"
) // 24 hours in ms

export async function POST(request: NextRequest) {
    try {
        let body
        try {
            body = await request.json()
        } catch (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid request body",
                },
                { status: 400 }
            )
        }

        const { email, userId, locale = "en" } = body

        if (!email || !userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Email and userId are required",
                },
                { status: 400 }
            )
        }

        // Verify user exists and email matches
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, email")
            .eq("id", userId)
            .single()

        if (userError || !user || user.email !== email.toLowerCase()) {
            return NextResponse.json(
                {
                    success: false,
                    error: "User not found or email mismatch",
                },
                { status: 404 }
            )
        }

        // Generate verification token
        const token = generateRandomHex(32)
        const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY)

        // Store token in database
        const { error: tokenError } = await supabase
            .from("email_verification_tokens")
            .insert({
                token,
                user_id: userId,
                email,
                expires_at: expiresAt.toISOString(),
            })

        if (tokenError) {
            console.error("Token creation error:", tokenError)
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to create verification token",
                },
                { status: 500 }
            )
        }

        // Send verification email
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/verify-email?token=${token}`
        const emailSent = await sendVerificationEmail(
            email,
            verificationLink,
            locale
        )

        if (!emailSent) {
            console.error("Failed to send verification email to:", email)
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to send verification email",
                },
                { status: 500 }
            )
        }

        // Log email verification event
        await logEmailVerification(email, "", userId)

        return NextResponse.json(
            {
                success: true,
                message: "Verification email sent successfully",
                expiresAt: expiresAt.toISOString(),
            },
            { status: 200 }
        )
    } catch (error) {
        console.error("Send verification email error:", error)
        return NextResponse.json(
            {
                success: false,
                error: "An unexpected error occurred",
            },
            { status: 500 }
        )
    }
}

function generateRandomHex(length: number): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
}
