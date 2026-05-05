/**
 * Email Service
 * Handles sending emails using Resend
 */

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailOptions {
    to: string
    subject: string
    html: string
    from?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
        const { to, subject, html, from = "noreply@gabrieltoth.com" } = options

        const result = await resend.emails.send({
            from,
            to,
            subject,
            html,
        })

        if (result.error) {
            console.error("Email send error:", result.error)
            return false
        }

        console.log("Email sent successfully:", result.data?.id)
        return true
    } catch (error) {
        console.error("Email service error:", error)
        return false
    }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
    email: string,
    verificationLink: string,
    locale: string = "en"
): Promise<boolean> {
    const subject =
        locale === "pt-BR"
            ? "Verifique seu email"
            : locale === "es"
              ? "Verifica tu correo electrónico"
              : locale === "de"
                ? "Bestätigen Sie Ihre E-Mail"
                : "Verify your email"

    const html =
        locale === "pt-BR"
            ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verifique seu email</h2>
            <p>Obrigado por se registrar! Clique no link abaixo para verificar seu email:</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Verificar Email
            </a>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${verificationLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Este link expira em 24 horas.</p>
        </div>
    `
            : locale === "es"
              ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verifica tu correo electrónico</h2>
            <p>¡Gracias por registrarte! Haz clic en el siguiente enlace para verificar tu correo:</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Verificar Correo
            </a>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${verificationLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Este enlace expira en 24 horas.</p>
        </div>
    `
              : locale === "de"
                ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bestätigen Sie Ihre E-Mail</h2>
            <p>Vielen Dank für Ihre Registrierung! Klicken Sie auf den folgenden Link, um Ihre E-Mail zu bestätigen:</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                E-Mail bestätigen
            </a>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Dieser Link verfällt in 24 Stunden.</p>
        </div>
    `
                : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify your email</h2>
            <p>Thank you for signing up! Click the link below to verify your email:</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Verify Email
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link expires in 24 hours.</p>
        </div>
    `

    return sendEmail({
        to: email,
        subject,
        html,
    })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
    email: string,
    resetLink: string,
    locale: string = "en"
): Promise<boolean> {
    const subject =
        locale === "pt-BR"
            ? "Redefinir sua senha"
            : locale === "es"
              ? "Restablecer tu contraseña"
              : locale === "de"
                ? "Passwort zurücksetzen"
                : "Reset your password"

    const html =
        locale === "pt-BR"
            ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Redefinir sua senha</h2>
            <p>Você solicitou para redefinir sua senha. Clique no link abaixo para continuar:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Redefinir Senha
            </a>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Este link expira em 1 hora. Se você não solicitou isso, ignore este email.</p>
        </div>
    `
            : locale === "es"
              ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Restablecer tu contraseña</h2>
            <p>Solicitaste restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Restablecer Contraseña
            </a>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
        </div>
    `
              : locale === "de"
                ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Passwort zurücksetzen</h2>
            <p>Sie haben angefordert, Ihr Passwort zurückzusetzen. Klicken Sie auf den folgenden Link, um fortzufahren:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Passwort zurücksetzen
            </a>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Dieser Link verfällt in 1 Stunde. Wenn Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail.</p>
        </div>
    `
                : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>You requested to reset your password. Click the link below to continue:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Reset Password
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
    `

    return sendEmail({
        to: email,
        subject,
        html,
    })
}
