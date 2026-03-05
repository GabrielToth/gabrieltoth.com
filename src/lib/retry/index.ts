// Retry Utility with Exponential Backoff
// Implements error handling strategy from distributed-infrastructure-logging spec

import { createLogger } from "../logger"

const logger = createLogger("RetryUtility")

export interface RetryConfig {
    maxAttempts: number
    initialDelayMs: number
    maxDelayMs: number
    backoffMultiplier: number
}

export const defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
}

const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = defaultRetryConfig
): Promise<T> {
    let lastError: Error
    let delay = config.initialDelayMs

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error as Error

            if (attempt === config.maxAttempts) {
                logger.error("Operation failed after max attempts", lastError, {
                    maxAttempts: config.maxAttempts,
                })
                throw lastError
            }

            logger.warn("Operation failed, retrying", {
                attempt,
                maxAttempts: config.maxAttempts,
                delay,
                error: lastError.message,
            })

            await sleep(delay)
            delay = Math.min(
                delay * config.backoffMultiplier,
                config.maxDelayMs
            )
        }
    }

    throw lastError!
}

/**
 * Retry with custom error handling
 */
export async function withRetryAndFilter<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: Error) => boolean,
    config: RetryConfig = defaultRetryConfig
): Promise<T> {
    let lastError: Error
    let delay = config.initialDelayMs

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error as Error

            // Check if we should retry this error
            if (!shouldRetry(lastError)) {
                logger.warn("Error not retryable", {
                    error: lastError.message,
                })
                throw lastError
            }

            if (attempt === config.maxAttempts) {
                logger.error("Operation failed after max attempts", lastError, {
                    maxAttempts: config.maxAttempts,
                })
                throw lastError
            }

            logger.warn("Operation failed, retrying", {
                attempt,
                maxAttempts: config.maxAttempts,
                delay,
                error: lastError.message,
            })

            await sleep(delay)
            delay = Math.min(
                delay * config.backoffMultiplier,
                config.maxDelayMs
            )
        }
    }

    throw lastError!
}
