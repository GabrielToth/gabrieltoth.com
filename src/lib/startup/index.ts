// Startup Handler
// Implements Requirements 2.8, 3.1, 8.9 from distributed-infrastructure-logging spec

import { DiscordAlerter } from "../discord/alerter"
import { createLogger } from "../logger"

const logger = createLogger("StartupHandler")

// List of sensitive environment variable keys that should never be logged
const SENSITIVE_ENV_VARS = [
    "PASSWORD",
    "SECRET",
    "TOKEN",
    "KEY",
    "PRIVATE",
    "CREDENTIAL",
    "AUTH",
    "API_KEY",
    "DATABASE_URL", // Contains password
    "REDIS_URL", // May contain password
    "DISCORD_WEBHOOK_URL", // Sensitive webhook URL
]

export interface StartupHandler {
    logStartup(version?: string): Promise<void>
}

export class StartupHandlerImpl implements StartupHandler {
    constructor(private discordAlerter: DiscordAlerter) {}

    async logStartup(version?: string): Promise<void> {
        const environment = process.env.NODE_ENV || "development"
        const appVersion =
            version || process.env.npm_package_version || "unknown"

        // Log startup
        logger.info("Application starting", {
            version: appVersion,
            environment,
            nodeVersion: process.version,
            platform: process.platform,
            pid: process.pid,
        })

        // Log non-sensitive configuration
        const safeConfig = this.getSafeConfiguration()
        logger.info("Configuration loaded", safeConfig)

        // Send startup alert to Discord
        await this.discordAlerter.sendAlert({
            level: "startup",
            title: "Application Started",
            message: `Application has started successfully`,
            context: {
                version: appVersion,
                environment,
                nodeVersion: process.version,
                timestamp: new Date().toISOString(),
            },
        })

        logger.info("Startup complete")
    }

    private getSafeConfiguration(): Record<string, any> {
        const config: Record<string, any> = {}

        for (const [key, value] of Object.entries(process.env)) {
            // Skip sensitive variables
            if (this.isSensitive(key)) {
                config[key] = "[REDACTED]"
            } else if (value !== undefined) {
                config[key] = value
            }
        }

        return config
    }

    private isSensitive(key: string): boolean {
        const upperKey = key.toUpperCase()
        return SENSITIVE_ENV_VARS.some(sensitive =>
            upperKey.includes(sensitive)
        )
    }
}

// Factory function
export const createStartupHandler = (
    discordAlerter: DiscordAlerter
): StartupHandler => {
    return new StartupHandlerImpl(discordAlerter)
}
