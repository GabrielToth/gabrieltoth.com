/**
 * Email Service
 *
 * Sends transactional emails (verification, password reset) via the Resend
 * HTTP API. Depends on `RESEND_API_KEY` (and `RESEND_FROM_EMAIL` /
 * `RESEND_FROM_NAME`) being configured.
 *
 * Previously this module only logged to `console.log` and returned `true`
 * without ever delivering an email. It now builds localized HTML bodies and
 * delegates delivery to `sendEmail` in `@/lib/resend`.
 */

import { sendEmail } from "@/lib/resend"
import { logger } from "@/lib/logger"

export interface SendEmailOptions {
    to: string
    subject: string
    html: string
    from?: string
}

type Locale = "en" | "pt-BR" | "es" | "de" | "fr"

const SUPPORTED_LOCALES: Locale[] = ["en", "pt-BR", "es", "de", "fr"]

function normalizeLocale(locale?: string): Locale {
    if (locale && SUPPORTED_LOCALES.includes(locale as Locale)) {
        return locale as Locale
    }
    return "en"
}

const SUBJECTS: Record<Locale, { verify: string; reset: string }> = {
    en: {
        verify: "Verify your email address",
        reset: "Reset your password",
    },
    "pt-BR": {
        verify: "Confirme seu endereço de e-mail",
        reset: "Redefina sua senha",
    },
    es: {
        verify: "Verifica tu dirección de correo electrónico",
        reset: "Restablece tu contraseña",
    },
    de: {
        verify: "Bestätige deine E-Mail-Adresse",
        reset: "Setze dein Passwort zurück",
    },
    fr: {
        verify: "Vérifiez votre adresse e-mail",
        reset: "Réinitialisez votre mot de passe",
    },
} as const

const FOOTER: Record<Locale, string> = {
    en: "If you did not request this, you can safely ignore this email.",
    "pt-BR":
        "Se você não solicitou isto, pode ignorar este e-mail com segurança.",
    es: "Si no solicitaste esto, puedes ignorar este correo de forma segura.",
    de: "Wenn du dies nicht angefordert hast, kannst du diese E-Mail ignorieren.",
    fr: "Si vous n'avez pas demandé cela, vous pouvez ignorer cet e-mail.",
} as const

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

/**
 * Builds a simple, responsive HTML email body around a title, a body line and
 * a call-to-action button.
 */
function buildEmailHtml(opts: {
    title: string
    bodyLine: string
    buttonLabel: string
    buttonUrl: string
    footer: string
}): string {
    const { title, bodyLine, buttonLabel, buttonUrl, footer } = opts
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 32px 8px;">
              <div style="font-size:20px;font-weight:700;color:#18181b;">${escapeHtml(title)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px;">
              <p style="font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 24px;">${escapeHtml(bodyLine)}</p>
              <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background-color:#18181b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:6px;">${escapeHtml(buttonLabel)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#fafafa;border-top:1px solid #e4e4e7;">
              <p style="font-size:12px;line-height:1.5;color:#71717a;margin:0;">${escapeHtml(footer)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Sends an email verification message with the provided token link.
 */
export async function sendVerificationEmail(
    email: string,
    verificationLink: string,
    locale: string = "en"
): Promise<boolean> {
    const lang = normalizeLocale(locale)
    const subject = SUBJECTS[lang].verify
    const html = buildEmailHtml({
        title: SUBJECTS[lang].verify,
        bodyLine:
            lang === "en"
                ? "Please confirm your email address by clicking the button below."
                : `Para verificar seu endereço de e-mail, clique no botão abaixo.`,
        buttonLabel: lang === "en" ? "Confirm email" : SUBJECTS[lang].verify,
        buttonUrl: verificationLink,
        footer: FOOTER[lang],
    })

    const result = await sendEmail({ to: email, subject, html })

    if (!result.success) {
        logger.error("Failed to send verification email", {
            context: "EmailService",
            data: { email, error: result.error },
        })
        return false
    }

    logger.info("Verification email sent", {
        context: "EmailService",
        data: { email, id: result.id },
    })
    return true
}

/**
 * Sends a password reset message with the provided reset link.
 */
export async function sendPasswordResetEmail(
    email: string,
    resetLink: string,
    locale: string = "en"
): Promise<boolean> {
    const lang = normalizeLocale(locale)
    const subject = SUBJECTS[lang].reset
    const html = buildEmailHtml({
        title: SUBJECTS[lang].reset,
        bodyLine:
            lang === "en"
                ? "Use the button below to reset your password."
                : `Use o botão abaixo para redefinir sua senha.`,
        buttonLabel: lang === "en" ? "Reset password" : SUBJECTS[lang].reset,
        buttonUrl: resetLink,
        footer: FOOTER[lang],
    })

    const result = await sendEmail({ to: email, subject, html })

    if (!result.success) {
        logger.error("Failed to send password reset email", {
            context: "EmailService",
            data: { email, error: result.error },
        })
        return false
    }

    logger.info("Password reset email sent", {
        context: "EmailService",
        data: { email, id: result.id },
    })
    return true
}
