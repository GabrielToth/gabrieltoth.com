// Centralized Logger with Discord Alerts
// Focus: Performance, Debugability, Minimal Noise

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal"

interface LogEntry {
    level: LogLevel
    message: string
    context?: string
    data?: Record<string, unknown>
    error?: Error
    timestamp: string
}

const LOG_COLORS: Record<LogLevel, string> = {
    debug: "\x1b[36m", // Cyan
    info: "\x1b[32m", // Green
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
    fatal: "\x1b[35m", // Magenta
}
const RESET = "\x1b[0m"

const isDev = process.env.NODE_ENV !== "production"
const isDebugEnabled =
    process.env.DEBUG === "true" || process.env.NEXT_PUBLIC_DEBUG === "true"

// Discord rate limiting with automatic cleanup
class DiscordRateLimiter {
    private cache = new Map<string, number>()
    private readonly windowMs: number
    private cleanupInterval: NodeJS.Timeout | null = null

    constructor(windowMs: number = 60000) {
        this.windowMs = windowMs
        // Cleanup old entries every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
    }

    shouldAllow(key: string): boolean {
        const now = Date.now()
        const lastSent = this.cache.get(key) || 0

        if (now - lastSent >= this.windowMs) {
            this.cache.set(key, now)
            return true
        }

        return false
    }

    private cleanup(): void {
        const now = Date.now()
        for (const [key, timestamp] of this.cache.entries()) {
            if (now - timestamp > this.windowMs) {
                this.cache.delete(key)
            }
        }
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
            this.cleanupInterval = null
        }
        this.cache.clear()
    }
}

const discordRateLimiter = new DiscordRateLimiter(60000)

/**
 * Send critical alerts to Discord
 * Only sends: error, fatal, startup, shutdown
 */
async function sendToDiscord(entry: LogEntry): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (!webhookUrl) return

    // Rate limit check
    const rateKey = `${entry.level}:${entry.context || "global"}`
    if (!discordRateLimiter.shouldAllow(rateKey)) return

    const color =
        entry.level === "fatal"
            ? 0xff0000
            : entry.level === "error"
              ? 0xffa500
              : 0x00ff00

    const embed = {
        title: `${entry.level.toUpperCase()}: ${entry.context || "Platform"}`,
        description: entry.message,
        color,
        fields: [] as { name: string; value: string; inline?: boolean }[],
        timestamp: entry.timestamp,
    }

    if (entry.error?.stack) {
        embed.fields.push({
            name: "Stack Trace",
            value: `\`\`\`${entry.error.stack.slice(0, 1000)}\`\`\``,
        })
    }

    if (entry.data) {
        embed.fields.push({
            name: "Data",
            value: `\`\`\`json\n${JSON.stringify(entry.data, null, 2).slice(0, 500)}\`\`\``,
        })
    }

    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds: [embed] }),
        })
    } catch {
        // Silently fail - don't log Discord errors
    }
}

/**
 * Format log output
 */
function formatLog(entry: LogEntry): string {
    if (isDev) {
        const color = LOG_COLORS[entry.level]
        const ctx = entry.context ? `[${entry.context}]` : ""
        const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : ""
        return `${color}[${entry.level.toUpperCase()}]${RESET} ${ctx} ${entry.message}${dataStr}`
    }

    // Production: JSON format for log aggregators
    return JSON.stringify({
        ...entry,
        error: entry.error
            ? { message: entry.error.message, stack: entry.error.stack }
            : undefined,
    })
}

/**
 * Core log function
 */
function log(
    level: LogLevel,
    message: string,
    options?: {
        context?: string
        data?: Record<string, unknown>
        error?: Error
    }
): void {
    // Skip debug in production unless explicitly enabled
    if (level === "debug" && !isDebugEnabled) return

    const entry: LogEntry = {
        level,
        message,
        context: options?.context,
        data: options?.data,
        error: options?.error,
        timestamp: new Date().toISOString(),
    }

    // Console output
    const output = formatLog(entry)
    if (level === "error" || level === "fatal") {
        console.error(output)
    } else if (level === "warn") {
        console.warn(output)
    } else {
        console.log(output)
    }

    // Discord alerts for critical issues
    if (level === "error" || level === "fatal") {
        sendToDiscord(entry)
    }
}

/**
 * Create a context-aware logger
 */
export function createLogger(context: string) {
    return {
        debug: (msg: string, data?: Record<string, unknown>) =>
            log("debug", msg, { context, data }),

        info: (msg: string, data?: Record<string, unknown>) =>
            log("info", msg, { context, data }),

        warn: (msg: string, data?: Record<string, unknown>) =>
            log("warn", msg, { context, data }),

        error: (msg: string, error?: Error, data?: Record<string, unknown>) =>
            log("error", msg, { context, data, error }),

        fatal: (msg: string, error?: Error, data?: Record<string, unknown>) =>
            log("fatal", msg, { context, data, error }),
    }
}

// Exported logger interface (default)
export const logger = {
    debug: (
        msg: string,
        opts?: { context?: string; data?: Record<string, unknown> }
    ) => log("debug", msg, opts),

    info: (
        msg: string,
        opts?: { context?: string; data?: Record<string, unknown> }
    ) => log("info", msg, opts),

    warn: (
        msg: string,
        opts?: { context?: string; data?: Record<string, unknown> }
    ) => log("warn", msg, opts),

    error: (
        msg: string,
        opts?: {
            context?: string
            data?: Record<string, unknown>
            error?: Error
        }
    ) => log("error", msg, opts),

    fatal: (
        msg: string,
        opts?: {
            context?: string
            data?: Record<string, unknown>
            error?: Error
        }
    ) => log("fatal", msg, opts),

    // Special: startup/shutdown events always go to Discord
    startup: (module: string, version?: string) => {
        const msg = version
            ? `${module} v${version} started`
            : `${module} started`
        log("info", msg, { context: "STARTUP" })
        sendToDiscord({
            level: "info",
            message: msg,
            context: "STARTUP",
            timestamp: new Date().toISOString(),
        })
    },

    shutdown: (module: string, reason?: string) => {
        const msg = reason
            ? `${module} shutdown: ${reason}`
            : `${module} shutdown`
        log("info", msg, { context: "SHUTDOWN" })
        sendToDiscord({
            level: "info",
            message: msg,
            context: "SHUTDOWN",
            timestamp: new Date().toISOString(),
        })
        // Cleanup rate limiter on shutdown
        discordRateLimiter.destroy()
    },
}

export default logger
