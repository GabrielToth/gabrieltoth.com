/**
 * Discord Stream Notifier
 * Sends rich embed notifications for scheduled/starting/live streams
 * Reuses the sendDiscordNotification function from src/lib/discord.ts
 */

import { sendDiscordNotification } from "../discord"

const TWITCH_PURPLE = 0x9146ff
const KICK_GREEN = 0x53fc18

/**
 * Get the embed color for a platform
 */
function getPlatformColor(platform: string): number {
    return platform === "twitch" ? TWITCH_PURPLE : KICK_GREEN
}

/**
 * Format a date to a relative time string
 */
function formatRelativeTime(isoString: string): string {
    const target = new Date(isoString).getTime()
    const now = Date.now()
    const diff = target - now

    if (diff <= 0) {
        return "Starting now!"
    }

    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)

    if (hours > 0) {
        return `In ${hours}h ${minutes}m`
    }
    return `In ${minutes}m`
}

/**
 * Notify that a stream has been scheduled
 * Sends a rich embed with title, scheduled time, duration, and platform
 */
export async function notifyStreamScheduled(
    title: string,
    platform: string[],
    startTime: string,
    durationMinutes: number
): Promise<void> {
    const platformNames = platform
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(", ")
    const relativeTime = formatRelativeTime(startTime)
    const duration =
        durationMinutes >= 60
            ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
            : `${durationMinutes}m`

    await sendDiscordNotification({
        title: "📅 Stream Scheduled",
        description: `**${title}** has been scheduled!`,
        color: 0x7289da, // Discord blurple
        fields: [
            {
                name: "🎮 Platform",
                value: platformNames,
                inline: true,
            },
            {
                name: "⏰ Start Time",
                value: relativeTime,
                inline: true,
            },
            {
                name: "📊 Duration",
                value: duration,
                inline: true,
            },
            {
                name: "🕐 Scheduled At",
                value: new Date(startTime).toLocaleString(),
                inline: false,
            },
        ],
    })
}

/**
 * Notify that a scheduled stream is starting soon
 * Sends an embed with '🚀 Starting soon' prefix
 */
export async function notifyStreamStarting(
    title: string,
    platform: string[],
    startTime: string
): Promise<void> {
    const primaryPlatform = platform[0] || "twitch"
    const platformNames = platform
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(", ")

    await sendDiscordNotification({
        title: "🚀 Stream Starting Soon",
        description: `**${title}** is starting soon on ${platformNames}!`,
        color: getPlatformColor(primaryPlatform),
        fields: [
            {
                name: "🎮 Platform",
                value: platformNames,
                inline: true,
            },
            {
                name: "⏰ Scheduled Time",
                value: new Date(startTime).toLocaleString(),
                inline: true,
            },
        ],
    })
}

/**
 * Notify that a stream is now live
 * Sends an embed with '🔴 LIVE' prefix
 */
export async function notifyStreamLive(
    title: string,
    platform: string[]
): Promise<void> {
    const primaryPlatform = platform[0] || "twitch"
    const platformNames = platform
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(", ")

    await sendDiscordNotification({
        title: "🔴 LIVE NOW",
        description: `**${title}** is now live on ${platformNames}!`,
        color: getPlatformColor(primaryPlatform),
        fields: [
            {
                name: "🎮 Platform",
                value: platformNames,
                inline: true,
            },
            {
                name: "🔗 Watch Now",
                value:
                    primaryPlatform === "twitch"
                        ? "https://twitch.tv/broadcast"
                        : "https://kick.com/dashboard/settings/stream",
                inline: false,
            },
        ],
    })
}
