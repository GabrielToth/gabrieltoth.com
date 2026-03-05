// Centralized Logger with Pino
// Focus: Performance (10,000+ logs/second), Structured JSON, Minimal Overhead

import type { Logger as PinoLogger } from "pino"
import pino from "pino"

const isDevelopment = process.env.NODE_ENV !== "production"
const isDebugEnabled = process.env.DEBUG === "true"

// Create base Pino logger
const baseLogger: PinoLogger = pino({
    level: isDebugEnabled ? "debug" : "info",
    formatters: {
        level: label => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
        pid: process.pid,
        hostname: process.env.HOSTNAME || "unknown",
    },
    // Pretty print in development, JSON in production
    transport: isDevelopment
        ? {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname",
              },
          }
        : undefined,
})

export interface Logger {
    debug(message: string, context?: Record<string, any>): void
    info(message: string, context?: Record<string, any>): void
    warn(message: string, context?: Record<string, any>): void
    error(message: string, error?: Error, context?: Record<string, any>): void
    fatal(message: string, error?: Error, context?: Record<string, any>): void
}

/**
 * Create a logger with a specific context
 * @param context - Component or module name for log identification
 */
export function createLogger(context: string): Logger {
    const childLogger = baseLogger.child({ context })

    return {
        debug: (message: string, meta?: Record<string, any>) => {
            if (isDebugEnabled) {
                childLogger.debug(meta || {}, message)
            }
        },

        info: (message: string, meta?: Record<string, any>) => {
            childLogger.info(meta || {}, message)
        },

        warn: (message: string, meta?: Record<string, any>) => {
            childLogger.warn(meta || {}, message)
        },

        error: (message: string, error?: Error, meta?: Record<string, any>) => {
            childLogger.error({ err: error, ...meta }, message)
        },

        fatal: (message: string, error?: Error, meta?: Record<string, any>) => {
            childLogger.fatal({ err: error, ...meta }, message)
        },
    }
}

// Export base logger for advanced use cases
export { baseLogger }

export default createLogger
