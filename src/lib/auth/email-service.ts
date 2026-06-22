/**
 * Email Service
 * Logs emails to console — Supabase Auth handles transactional email sending
 * via its built-in email service (SMTP or Resend integration).
 */

export interface SendEmailOptions {
    to: string
    subject: string
    html: string
    from?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    console.log("[EMAIL]", {
        to: options.to,
        subject: options.subject,
        from: options.from || "noreply@gabrieltoth.com",
    })
    return true
}

export async function sendVerificationEmail(
    email: string,
    verificationLink: string,
    locale: string = "en"
): Promise<boolean> {
    console.log("[EMAIL] Verification email requested", {
        email,
        verificationLink,
        locale,
    })
    return true
}

export async function sendPasswordResetEmail(
    email: string,
    resetLink: string,
    locale: string = "en"
): Promise<boolean> {
    console.log("[EMAIL] Password reset email requested", {
        email,
        resetLink,
        locale,
    })
    return true
}
