import { notifyError } from "@/lib/discord"
import { basicFirewall, getClientIp } from "@/lib/firewall"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

interface ContactFormData {
    name: string
    email: string
    subject: string
    message: string
    locale: "en" | "pt-BR"
    turnstileToken?: string
}

// Initialize Resend (conditionally to avoid build errors)
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

// In-memory fallback for dev; production uses Upstash via lib/rate-limit
const submissions = new Map<string, number[]>()
const RATE_LIMIT = { MAX_REQUESTS: 5, WINDOW_MS: 15 * 60 * 1000 }

// Lista de palavras/padrões suspeitos de spam
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

// getClientIP moved to lib/firewall as getClientIp

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

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const userSubmissions = submissions.get(ip) || []

    // Remove submissions antigas (fora da janela de tempo)
    const recentSubmissions = userSubmissions.filter(
        timestamp => now - timestamp < RATE_LIMIT.WINDOW_MS
    )

    submissions.set(ip, recentSubmissions)

    return recentSubmissions.length >= RATE_LIMIT.MAX_REQUESTS
}

function addSubmission(ip: string): void {
    const now = Date.now()
    const userSubmissions = submissions.get(ip) || []
    userSubmissions.push(now)
    submissions.set(ip, userSubmissions)
}

function containsSpam(text: string): boolean {
    return SPAM_PATTERNS.some(pattern => pattern.test(text))
}

function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

function getConfirmationEmailContent(
    name: string,
    subject: string,
    message: string,
    locale: "en" | "pt-BR"
) {
    if (locale === "pt-BR") {
        return {
            subject: "Confirmação - Sua mensagem foi enviada com sucesso",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Olá ${name}!</h2>

                    <p>Obrigado por entrar em contato! Sua mensagem foi enviada com sucesso e receberemos em breve.</p>

                    <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Resumo da sua mensagem:</h3>
                        <p><strong>Assunto:</strong> ${subject}</p>
                        <p><strong>Mensagem:</strong></p>
                        <p style="white-space: pre-wrap;">${message}</p>
                    </div>

                    <p>Normalmente respondemos dentro de 24-48 horas durante dias úteis.</p>

                    <hr style="margin: 30px 0;">

                    <h3 style="color: #333;">FAQ - Perguntas Frequentes</h3>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #007bff; margin-bottom: 5px;">Quanto tempo leva para receber uma resposta?</h4>
                        <p>Normalmente respondemos dentro de 24-48 horas durante dias úteis (segunda a sexta).</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #007bff; margin-bottom: 5px;">Que tipos de projetos vocês desenvolvem?</h4>
                        <p>Desenvolvemos aplicações web modernas, APIs, sistemas corporativos e soluções full-stack usando tecnologias como React, Next.js, Node.js, TypeScript e muito mais.</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #007bff; margin-bottom: 5px;">Como funciona o processo de desenvolvimento?</h4>
                        <p>1. Análise dos requisitos<br>2. Proposta técnica e orçamento<br>3. Desenvolvimento iterativo<br>4. Testes e validação<br>5. Deploy e entrega</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #007bff; margin-bottom: 5px;">Vocês oferecem suporte pós-entrega?</h4>
                        <p>Sim! Oferecemos diferentes planos de suporte e manutenção conforme a necessidade do projeto.</p>
                    </div>

                    <p style="margin-top: 30px;">
                        <strong>Gabriel Toth Gonçalves</strong><br>
                        Full Stack Developer<br>
                        <a href="https://gabrieltoth.com">gabrieltoth.com</a>
                    </p>
                </div>
            `,
        }
    } else {
        return {
            subject: "Confirmation - Your message has been sent successfully",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Hello ${name}!</h2>

                    <p>Thank you for getting in touch! Your message has been sent successfully and we'll receive it shortly.</p>

                    <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Summary of your message:</h3>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong></p>
                        <p style="white-space: pre-wrap;">${message}</p>
                    </div>

                    <p>We typically respond within 24-48 hours during business days.</p>

                    <hr style="margin: 30px 0;">

                    <h3 style="color: #333;">FAQ - Frequently Asked Questions</h3>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #007bff; margin-bottom: 5px;">How long does it take to receive a response?</h4>
                        <p>We typically respond within 24-48 hours during business days (Monday to Friday).</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #007bff; margin-bottom: 5px;">What types of projects do you develop?</h4>
                        <p>We develop modern web applications, APIs, corporate systems, and full-stack solutions using technologies like React, Next.js, Node.js, TypeScript, and much more.</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #007bff; margin-bottom: 5px;">How does the development process work?</h4>
                        <p>1. Requirements analysis<br>2. Technical proposal and budget<br>3. Iterative development<br>4. Testing and validation<br>5. Deployment and delivery</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #007bff; margin-bottom: 5px;">Do you offer post-delivery support?</h4>
                        <p>Yes! We offer different support and maintenance plans according to the project's needs.</p>
                    </div>

                    <p style="margin-top: 30px;">
                        <strong>Gabriel Toth Gonçalves</strong><br>
                        Full Stack Developer<br>
                        <a href="https://gabrieltoth.com">gabrieltoth.com</a>
                    </p>
                </div>
            `,
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const clientIP = getClientIp(request)
        const userAgent = request.headers.get("user-agent") || ""
        const path = "/api/contact"

        // App-level firewall checks
        const fw = basicFirewall(request, [
            "https://gabrieltoth.com",
            "https://www.gabrieltoth.com",
        ])
        if (!fw.ok) {
            await notifyError({
                type: "FIREWALL_BLOCK",
                message: fw.reason || "BLOCKED",
            })
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        // Persistent rate limit (Upstash) + fallback in-memory
        const key = buildClientKey({ ip: clientIP, path, userAgent })
        const rl = await rateLimitByKey(key)
        if (!rl.success || isRateLimited(clientIP)) {
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
            parsed = (await request.json()) as ContactFormData
        } else {
            const form = await request.formData()
            parsed = {
                name: String(form.get("name") || ""),
                email: String(form.get("email") || ""),
                subject: String(form.get("subject") || ""),
                message: String(form.get("message") || ""),
                locale: String(form.get("locale") || "pt-BR") as "en" | "pt-BR",
                turnstileToken: String(form.get("cf-turnstile-response") || ""),
            }
        }

        const { name, email, subject, message, locale, turnstileToken } = parsed

        // Checar Origin/Referer (básico)
        // origin/referer já checados no firewall

        // Verificar Turnstile
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

        // Validações básicas
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

        // Verificar spam
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

        // Adicionar ao rate limiting
        addSubmission(clientIP)

        // Verificar se o Resend está configurado
        if (!resend || !process.env.RESEND_API_KEY) {
            console.log(
                "📧 Nova mensagem de contato (Resend não configurado):",
                {
                    timestamp: new Date().toISOString(),
                    ip: clientIP,
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    subject: subject.trim(),
                    message: message.trim(),
                    locale,
                }
            )

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
        }

        try {
            // Email para Gabriel (receber a mensagem)
            const toGabrielEmail = await resend.emails.send({
                from: "Portfolio Contact <noreply@gabrieltoth.com>",
                to: ["gabriel.toth.dev@gmail.com"],
                subject: `[Portfolio] ${subject}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Nova mensagem de contato do portfólio</h2>

                        <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
                            <p><strong>Nome:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Assunto:</strong> ${subject}</p>
                            <p><strong>IP:</strong> ${clientIP}</p>
                            <p><strong>Idioma:</strong> ${locale}</p>
                            <p><strong>Data:</strong> ${new Date().toISOString()}</p>
                        </div>

                        <h3>Mensagem:</h3>
                        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #ddd; white-space: pre-wrap;">
${message}
                        </div>
                    </div>
                `,
            })

            // Email de confirmação para o remetente
            const confirmationContent = getConfirmationEmailContent(
                name,
                subject,
                message,
                locale
            )
            const confirmationEmail = await resend.emails.send({
                from: "Gabriel Toth <noreply@gabrieltoth.com>",
                to: [email],
                subject: confirmationContent.subject,
                html: confirmationContent.html,
            })

            console.log("📧 Emails enviados com sucesso:", {
                toGabriel: toGabrielEmail.data?.id,
                confirmation: confirmationEmail.data?.id,
            })
        } catch (emailError) {
            console.error("Erro ao enviar emails:", emailError)

            // Log da mensagem mesmo se o email falhar
            console.log("📧 Nova mensagem de contato (erro no email):", {
                timestamp: new Date().toISOString(),
                ip: clientIP,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                subject: subject.trim(),
                message: message.trim(),
                locale,
            })
        }

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

// Não permitir outros métodos HTTP
export async function GET() {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 })
}
