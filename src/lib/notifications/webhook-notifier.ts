/**
 * Webhook Notifier Service
 * Handles formatting and dispatching notifications to Discord Webhooks and Telegram Bots.
 */

export interface NotificationEvent {
    title: string
    description: string
    eventType: "stream_live" | "auth_error" | "follower_alert" | "system_alert"
    platform?: string
    metadata?: Record<string, unknown>
}

export interface DiscordEmbed {
    title: string
    description: string
    color: number
    fields?: Array<{ name: string; value: string; inline?: boolean }>
    timestamp?: string
}

export const EVENT_COLORS: Record<NotificationEvent["eventType"], number> = {
    stream_live: 0x57f287, // Green
    auth_error: 0xed4245, // Red
    follower_alert: 0x5865f2, // Blurple
    system_alert: 0xfee75c, // Yellow
}

/**
 * Formats a Discord embed payload
 */
export function formatDiscordEmbed(event: NotificationEvent): {
    embeds: DiscordEmbed[]
} {
    const color = EVENT_COLORS[event.eventType] || 0x5865f2
    const fields: Array<{ name: string; value: string; inline?: boolean }> = []

    if (event.platform) {
        fields.push({ name: "Platform", value: event.platform, inline: true })
    }

    if (event.metadata) {
        for (const [key, value] of Object.entries(event.metadata)) {
            fields.push({
                name: key,
                value: String(value),
                inline: true,
            })
        }
    }

    return {
        embeds: [
            {
                title: event.title,
                description: event.description,
                color,
                fields: fields.length > 0 ? fields : undefined,
                timestamp: new Date().toISOString(),
            },
        ],
    }
}

/**
 * Formats a Telegram Markdown message payload
 */
export function formatTelegramMessage(
    chatId: string,
    event: NotificationEvent
): { chat_id: string; text: string; parse_mode: string } {
    let text = `*${event.title}*\n${event.description}`

    if (event.platform) {
        text += `\n\n*Platform:* ${event.platform}`
    }

    if (event.metadata) {
        text += "\n*Details:*"
        for (const [key, val] of Object.entries(event.metadata)) {
            text += `\n• ${key}: ${String(val)}`
        }
    }

    return {
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
    }
}

/**
 * Dispatches a notification to a Discord webhook URL
 */
export async function sendDiscordNotification(
    webhookUrl: string,
    event: NotificationEvent
): Promise<{ success: boolean; error?: string }> {
    if (!webhookUrl) {
        return { success: false, error: "Missing webhook URL" }
    }

    try {
        const payload = formatDiscordEmbed(event)
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            return {
                success: false,
                error: `Discord API returned HTTP ${res.status}`,
            }
        }

        return { success: true }
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        }
    }
}

/**
 * Dispatches a notification to a Telegram bot
 */
export async function sendTelegramNotification(
    botToken: string,
    chatId: string,
    event: NotificationEvent
): Promise<{ success: boolean; error?: string }> {
    if (!botToken || !chatId) {
        return { success: false, error: "Missing bot token or chat ID" }
    }

    try {
        const payload = formatTelegramMessage(chatId, event)
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            return {
                success: false,
                error: `Telegram API returned HTTP ${res.status}`,
            }
        }

        return { success: true }
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        }
    }
}
