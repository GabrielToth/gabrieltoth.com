import { notifyContactMessage, notifyError } from "@/lib/discord"
import { basicFirewall, getClientIp } from "@/lib/firewall"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"

interface ContactFormData {
    name: string
    email: string
    subject: string
    message: string
    locale: "en" | "pt-BR"
    turnstileToken?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RATE_LIMIT = { MAX_REQUESTS: 5, WINDOW_MS: 15 * 60 * 1000 }

const SPAM_PATTERNS = [
    /crypto/i,
    /bitcoin/i,
    /investment/i,
    /loan/i,
    /money/i,
    /casino/i,
    /viagra/i,
    /pills/i,
    /pharmacy/i,
    /lottery/i,
    /winner/i,
    /congratulations/i,
    /click here/i,
    /urgent/i,
    /limited time/i,
    /act now/i,
]

async function verifyTurnstileToken(token: string | undefined, ip: string) {
    const secret = process.env.TURNSTILE_SECRET_KEY
    if (!secret) return { success: true }
    if (!token) return { success: false }
    try {
        const resp = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    secret,
                    response: token,
                    remoteip: ip,
                }),
            }
        )
        const data = (await resp.json()) as {
            success: boolean
            "error-codes"?: string[]
        }
        return data
    } catch {
        return { success: false }
    }
}

function containsSpam(text: string): boolean {
    return SPAM_PATTERNS.some(pattern => pattern.test(text))
}

function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
    try {
        const clientIP = getClientIp(request)
        const userAgent = request.headers.get("user-agent") || ""
        const path = "/api/contact"

        const fw = basicFirewall(request, [
            "https://www.gabrieltoth.com",
            "https://www.gabrieltoth.com",
        ])
        if (!fw.ok) {
            await notifyError({
                type: "FIREWALL_BLOCK",
                message: fw.reason || "BLOCKED",
            })
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        const key = buildClientKey({ ip: clientIP, path, userAgent })
        const rl = await rateLimitByKey(key)
        if (!rl.success) {
            return NextResponse.json(
                {
                    message: "Too many requests. Please try again later.",
                    error: "RATE_LIMITED",
                },
                { status: 429 }
            )
        }

        const contentType = request.headers.get("content-type") || ""
        let parsed: ContactFormData
        if (contentType.includes("application/json")) {
            try {
                parsed = (await request.json()) as ContactFormData
            } catch {
                parsed = {
                    name: "",
                    email: "",
                    subject: "",
                    message: "",
                    locale: "en",
                    turnstileToken: "",
                }
            }
        } else {
            try {
                const form = await request.formData()
                parsed = {
                    name: String(form.get("name") || ""),
                    email: String(form.get("email") || ""),
                    subject: String(form.get("subject") || ""),
                    message: String(form.get("message") || ""),
                    locale: String(form.get("locale") || "pt-BR") as
                        | "en"
                        | "pt-BR",
                    turnstileToken: String(
                        form.get("cf-turnstile-response") || ""
                    ),
                }
            } catch {
                parsed = {
                    name: "",
                    email: "",
                    subject: "",
                    message: "",
                    locale: "en",
                    turnstileToken: "",
                }
            }
        }

        const { name, email, subject, message, locale, turnstileToken } = parsed

        const turnstileResult = await verifyTurnstileToken(
            turnstileToken,
            clientIP
        )
        if (!turnstileResult.success) {
            return NextResponse.json(
                {
                    message:
                        locale === "pt-BR"
                            ? "Falha na verificação anti-bot"
                            : "Bot verification failed",
                    error: "TURNSTILE_FAILED",
                },
                { status: 400 }
            )
        }

        if (
            !name?.trim() ||
            !email?.trim() ||
            !subject?.trim() ||
            !message?.trim()
        ) {
            return NextResponse.json(
                {
                    message:
                        locale === "pt-BR"
                            ? "Todos os campos são obrigatórios"
                            : "All fields are required",
                    error: "MISSING_FIELDS",
                },
                { status: 400 }
            )
        }

        if (!validateEmail(email)) {
            return NextResponse.json(
                {
                    message:
                        locale === "pt-BR" ? "Email inválido" : "Invalid email",
                    error: "INVALID_EMAIL",
                },
                { status: 400 }
            )
        }

        const fullText = `${name} ${email} ${subject} ${message}`.toLowerCase()
        if (containsSpam(fullText)) {
            return NextResponse.json(
                {
                    message:
                        locale === "pt-BR"
                            ? "Conteúdo suspeito detectado"
                            : "Suspicious content detected",
                    error: "SPAM_DETECTED",
                },
                { status: 400 }
            )
        }

        try {
            await notifyContactMessage({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                subject: subject.trim(),
                message: message.trim(),
                locale,
                ip: clientIP,
            })
        } catch (e) {
            console.error("Discord notification failed:", e)
        }

        console.log("Nova mensagem de contato:", {
            timestamp: new Date().toISOString(),
            ip: clientIP,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            locale,
        })

        return NextResponse.json(
            {
                message:
                    locale === "pt-BR"
                        ? "Mensagem enviada com sucesso!"
                        : "Message sent successfully!",
                success: true,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error("Erro na API de contato:", error)
        await notifyError({
            type: "CONTACT_API_ERROR",
            message: error instanceof Error ? error.message : String(error),
        })

        return NextResponse.json(
            {
                message: "Internal server error",
                error: "INTERNAL_ERROR",
            },
            { status: 500 }
        )
    }
}

/* c8 ignore start */
export async function GET() {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 })
}
/* c8 ignore stop */
