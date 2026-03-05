// Discord Alerter with Rate Limiting
// Focus: Critical alerts only, non-blocking, rate-limited

import { createLogger } from "../logger/pino-logger"
import { InMemoryRateLimiter, type RateLimiter } from "./rate-limiter"

const logger = createLogger("DiscordAlerter")

export type AlertLevel = "error" | "fatal" | "startup" | "shutdown"

export interface Alert {
    level: AlertLevel
    title: string
    message: string
    context?: Record<string, any>
    stack?: string
}

export interface DiscordAlerter {
    sendAlert(alert: Alert): Promise<void>
}

export class DiscordAlerterImpl implements DiscordAlerter {
    private webhookUrl: string
    private rateLimiter: RateLimiter

    constructor(webhookUrl: string, rateLimiter?: RateLimiter) {
        this.webhookUrl = webhookUrl
        this.rateLimiter = rateLimiter || new InMemoryRateLimiter(60000) // 1 minute default
    }

    async sendAlert(alert: Alert): Promise<void> {
        // Rate limit key: level + title for granular control
        const rateLimitKey = `${alert.level}:${alert.title}`

        if (!this.rateLimiter.shouldAllow(rateLimitKey)) {
            logger.debug("Alert suppressed by rate limiter", {
                alert: rateLimitKey,
            })
            return
        }

        const embed = this.createEmbed(alert)

        try {
            const response = await fetch(this.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ embeds: [embed] }),
            })

            if (!response.ok) {
                logger.error(
                    "Failed to send Discord alert",
                    new Error(`HTTP ${response.status}`),
                    {
                        alert: rateLimitKey,
                        status: response.status,
                    }
                )
            }
        } catch (error) {
            // Non-blocking: log error but don't throw
            logger.error("Discord webhook request failed", error as Error, {
                alert: rateLimitKey,
            })
        }
    }

    private createEmbed(alert: Alert): any {
        const colors: Record<AlertLevel, number> = {
            error: 0xffa500, // Orange
            fatal: 0xff0000, // Red
            startup: 0x00ff00, // Green
            shutdown: 0x0000ff, // Blue
        }

        const embed: any = {
            title: alert.title,
            description: alert.message,
            color: colors[alert.level],
            fields: [],
            timestamp: new Date().toISOString(),
        }

        // Add context if present
        if (alert.context && Object.keys(alert.context).length > 0) {
            embed.fields.push({
                name: "Context",
                value:
                    "```json\n" +
                    JSON.stringify(alert.context, null, 2).substring(0, 500) +
                    "\n```",
            })
        }

        // Add stack trace if present (truncated to fit Discord limits)
        if (alert.stack) {
            embed.fields.push({
                name: "Stack Trace",
                value: "```\n" + alert.stack.substring(0, 1000) + "\n```",
            })
        }

        return embed
    }
}

// Factory function for easy instantiation
export function createDiscordAlerter(webhookUrl?: string): DiscordAlerter {
    const url = webhookUrl || process.env.DISCORD_WEBHOOK_URL

    if (!url) {
        throw new Error("Discord webhook URL is required")
    }

    return new DiscordAlerterImpl(url)
}

export default createDiscordAlerter
