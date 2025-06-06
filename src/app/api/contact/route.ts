import { NextRequest, NextResponse } from "next/server"

interface ContactFormData {
    name: string
    email: string
    message: string
    locale: "en" | "pt-BR"
}

// Rate limiting básico - em uma aplicação real, use Redis ou similar
const submissions = new Map<string, number[]>()

const RATE_LIMIT = {
    MAX_REQUESTS: 3, // Máximo 3 emails por IP
    WINDOW_MS: 60 * 60 * 1000, // Janela de 1 hora
}

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

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for")
    const real = request.headers.get("x-real-ip")

    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }

    if (real) {
        return real
    }

    return "127.0.0.1"
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

export async function POST(request: NextRequest) {
    try {
        const clientIP = getClientIP(request)

        // Verificar rate limiting
        if (isRateLimited(clientIP)) {
            return NextResponse.json(
                {
                    message: "Too many requests. Please try again later.",
                    error: "RATE_LIMITED",
                },
                { status: 429 }
            )
        }

        const body: ContactFormData = await request.json()
        const { name, email, message, locale } = body

        // Validações básicas
        if (!name?.trim() || !email?.trim() || !message?.trim()) {
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
        const fullText = `${name} ${email} ${message}`.toLowerCase()
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

        // Aqui você pode integrar com:
        // - Serviço de email (SendGrid, AWS SES, etc.)
        // - Banco de dados
        // - Webhook Discord/Slack
        // - Sistema de notificações

        // Por enquanto, vamos simular o envio e logar
        console.log("📧 Nova mensagem de contato:", {
            timestamp: new Date().toISOString(),
            ip: clientIP,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim(),
            locale,
        })

        // Simular delay de processamento
        await new Promise(resolve => setTimeout(resolve, 1000))

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
