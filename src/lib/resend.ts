export interface SendEmailOptions {
    to: string | string[]
    subject: string
    html: string
    from?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        // Fallback for dev mode / no key
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log(`[Resend Dev Fallback] Email to ${options.to}: ${options.subject}`)
            return { success: true, id: "dev_mock_id" }
        }
        return { success: false, error: "RESEND_API_KEY environment variable not configured." }
    }

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: options.from || "Gabriel Toth <contato@gabrieltoth.com>",
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                html: options.html,
            }),
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            return { success: false, error: errData.message || `HTTP ${response.status}` }
        }

        const data = await response.json()
        return { success: true, id: data.id }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error"
        return { success: false, error: message }
    }
}
