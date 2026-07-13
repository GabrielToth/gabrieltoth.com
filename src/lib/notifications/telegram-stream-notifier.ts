/**
 * Telegram Stream Notifier
 * Sends HTML-formatted messages via Telegram Bot API for scheduled/starting/live streams
 * Uses fetch() with no npm dependencies
 */

import { getConfig } from "@/config/environment"
import { createLogger } from "../logger"

const logger = createLogger("TelegramStreamNotifier")

/**
 * Simple rate limiter: max 1 message per 5 seconds
 */
class RateLimiter {
    private lastSent: number = 0
    private readonly minInterval: number = 5000 // 5 seconds
    private queue: Array<() => Promise<void>> = []
    private processing: boolean = false

    async schedule(fn: () => Promise<void>): Promise<void> {
        this.queue.push(fn)
        if (!this.processing) {
            await this.processQueue()
        }
    }

    private async processQueue(): Promise<void> {
        this.processing = true
        while (this.queue.length > 0) {
            const now = Date.now()
            const waitTime = this.lastSent + this.minInterval - now
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime))
            }
            const fn = this.queue.shift()
            if (fn) {
                this.lastSent = Date.now()
                try {
                    await fn()
                } catch {
                    // Individual message failures are handled in the calling code
                }
            }
        }
        this.processing = false
    }
}

const rateLimiter = new RateLimiter()

/**
 * Get the Telegram Bot API URL
 */
function getApiUrl(token: string, method: string): string {
    return `https://api.telegram.org/bot${token}/${method}`
}

/**
 * Send a message via Telegram Bot API
 */
async function sendTelegramMessage(message: string): Promise<void> {
    const config = getConfig()
    const token = config.notifications.telegramBotToken
    const chatId = config.notifications.telegramChatId

    if (!token || !chatId) {
        logger.warn("Telegram not configured, skipping notification")
        return
    }

    try {
        const response = await fetch(getApiUrl(token, "sendMessage"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML",
                disable_web_page_preview: true,
            }),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            logger.error("Telegram API error", {
                status: response.status,
                body: errorBody,
            })
        } else {
            logger.info("Telegram notification sent successfully")
        }
    } catch (error) {
        logger.error("Error sending Telegram notification", { error })
    }
}

/**
 * Notify that a stream has been scheduled
 */
export async function notifyStreamScheduled(
    title: string,
    platform: string[],
    startTime: string
): Promise<void> {
    const platformNames = platform
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(", ")
    const startDate = new Date(startTime).toLocaleString()

    const message =
        `<b>📅 Stream Scheduled</b>\n\n` +
        `<b>${escapeHtml(title)}</b>\n\n` +
        `🎮 <b>Platform:</b> ${platformNames}\n` +
        `⏰ <b>Start Time:</b> ${startDate}`

    await rateLimiter.schedule(() => sendTelegramMessage(message))
}

/**
 * Notify that a scheduled stream is starting soon
 */
export async function notifyStreamStarting(
    title: string,
    platform: string[]
): Promise<void> {
    const platformNames = platform
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(", ")

    const message =
        `<b>🚀 Starting Soon</b>\n\n` +
        `<b>${escapeHtml(title)}</b>\n\n` +
        `🎮 <b>Platform:</b> ${platformNames}\n` +
        `⚡ The stream is starting soon!`

    await rateLimiter.schedule(() => sendTelegramMessage(message))
}

/**
 * Notify that a stream is now live
 */
export async function notifyStreamLive(
    title: string,
    platform: string[]
): Promise<void> {
    const primaryPlatform = platform[0] || "twitch"
    const platformNames = platform
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(", ")
    const watchUrl =
        primaryPlatform === "twitch"
            ? "https://twitch.tv/broadcast"
            : "https://kick.com/dashboard/settings/stream"

    const message =
        `<b>🔴 LIVE NOW</b>\n\n` +
        `<b>${escapeHtml(title)}</b>\n\n` +
        `🎮 <b>Platform:</b> ${platformNames}\n` +
        `🔗 <a href="${watchUrl}">Watch Now</a>`

    await rateLimiter.schedule(() => sendTelegramMessage(message))
}

/**
 * Escape HTML entities for Telegram message safety
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}
