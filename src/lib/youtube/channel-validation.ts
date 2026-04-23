/**
 * Channel Validation Service
 * Validates YouTube channel ownership through YouTube API integration
 * Implements channel ID validation against OAuth response
 * Handles API failures and rate limiting
 * Validates: Requirements 2.1, 2.2
 */

import { createLogger } from "../logger"
import { BaseService, ServiceError } from "./base-service"
import { YouTubeChannelLinkingConfig } from "./config"

/**
 * YouTube channel information returned from API
 */
export interface YouTubeChannelInfo {
    channelId: string
    title: string
    description: string
    customUrl?: string
    subscriberCount?: number
    profileImageUrl?: string
}

/**
 * Channel validation result
 */
export interface ChannelValidationResult {
    valid: boolean
    channelInfo?: YouTubeChannelInfo
    error?: string
}

/**
 * OAuth response containing channel information
 */
export interface OAuthResponse {
    accessToken: string
    channelId?: string
    email?: string
    name?: string
}

/**
 * Rate limiting state for API calls
 */
interface RateLimitState {
    requestCount: number
    resetTime: number
}

/**
 * Channel Validation Service
 * Handles YouTube API integration and channel ownership validation
 */
export class ChannelValidationService extends BaseService {
    private logger = createLogger("ChannelValidationService")
    private config: YouTubeChannelLinkingConfig
    private rateLimitMap: Map<string, RateLimitState> = new Map()
    private readonly RATE_LIMIT_WINDOW = 60000 // 1 minute
    private readonly RATE_LIMIT_MAX_REQUESTS = 100 // Max requests per minute

    constructor(config: YouTubeChannelLinkingConfig) {
        super()
        this.config = config
    }

    /**
     * Validate channel ownership by comparing OAuth response with YouTube API
     * @param oauthResponse - OAuth response from YouTube
     * @param expectedChannelId - Expected channel ID to validate against
     * @returns Validation result with channel info if valid
     * @throws ServiceError if validation fails
     *
     * **Validates: Requirements 2.1, 2.2**
     */
    async validateChannelOwnership(
        oauthResponse: OAuthResponse,
        expectedChannelId: string
    ): Promise<ChannelValidationResult> {
        this.assertReady()

        if (!oauthResponse.accessToken) {
            return {
                valid: false,
                error: "Access token is required",
            }
        }

        if (!expectedChannelId) {
            return {
                valid: false,
                error: "Expected channel ID is required",
            }
        }

        try {
            // Check rate limiting
            this.checkRateLimit("channel-validation")

            // Fetch channel information from YouTube API
            const channelInfo = await this.getChannelInfo(
                oauthResponse.accessToken
            )

            if (!channelInfo) {
                return {
                    valid: false,
                    error: "Failed to retrieve channel information from YouTube API",
                }
            }

            // Validate channel ID matches
            if (channelInfo.channelId !== expectedChannelId) {
                this.logger.warn("Channel ID mismatch", {
                    expected: expectedChannelId,
                    actual: channelInfo.channelId,
                })

                return {
                    valid: false,
                    error: "Channel ID does not match OAuth response",
                }
            }

            this.logger.info("Channel ownership validated successfully", {
                channelId: channelInfo.channelId,
            })

            return {
                valid: true,
                channelInfo,
            }
        } catch (error) {
            const serviceError = this.handleError(
                error,
                "Channel validation failed",
                {
                    expectedChannelId,
                }
            )

            return {
                valid: false,
                error: serviceError.message,
            }
        }
    }

    /**
     * Fetch channel information from YouTube API
     * @param accessToken - OAuth access token
     * @returns Channel information or null if fetch fails
     * @throws ServiceError if API call fails after retries
     *
     * **Validates: Requirements 2.1**
     */
    async getChannelInfo(
        accessToken: string
    ): Promise<YouTubeChannelInfo | null> {
        this.assertReady()

        if (!accessToken) {
            throw new ServiceError(
                "INVALID_ACCESS_TOKEN",
                "Access token is required",
                400
            )
        }

        const maxRetries = 3
        let lastError: Error | null = null

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                this.logger.debug(
                    `Fetching channel info (attempt ${attempt + 1}/${maxRetries})`
                )

                const response = await this.callYouTubeAPI(
                    accessToken,
                    "https://www.googleapis.com/youtube/v3/channels",
                    {
                        part: "snippet,statistics",
                        mine: "true",
                    }
                )

                if (!response.items || response.items.length === 0) {
                    throw new ServiceError(
                        "NO_CHANNEL_FOUND",
                        "No channel found for the authenticated user",
                        404
                    )
                }

                const channel = response.items[0]

                return {
                    channelId: channel.id,
                    title: channel.snippet?.title || "",
                    description: channel.snippet?.description || "",
                    customUrl: channel.snippet?.customUrl,
                    subscriberCount: parseInt(
                        channel.statistics?.subscriberCount || "0"
                    ),
                    profileImageUrl: channel.snippet?.thumbnails?.default?.url,
                }
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error))

                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    throw error
                }

                // Exponential backoff
                if (attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
                    this.logger.debug(`Retrying after ${delay}ms`, { attempt })
                    await this.sleep(delay)
                }
            }
        }

        throw new ServiceError(
            "CHANNEL_INFO_FETCH_FAILED",
            `Failed to fetch channel information after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`,
            500,
            { lastError: lastError?.message }
        )
    }

    /**
     * Call YouTube API with error handling
     * @param accessToken - OAuth access token
     * @param url - API endpoint URL
     * @param params - Query parameters
     * @returns API response
     * @throws ServiceError if API call fails
     */
    private async callYouTubeAPI(
        accessToken: string,
        url: string,
        params: Record<string, string | boolean>
    ): Promise<any> {
        try {
            // Build query string
            const queryParams = new URLSearchParams()
            for (const [key, value] of Object.entries(params)) {
                queryParams.append(key, String(value))
            }

            const fullUrl = `${url}?${queryParams.toString()}`

            this.logger.debug("Calling YouTube API", { url: fullUrl })

            const response = await fetch(fullUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/json",
                },
                timeout: 10000, // 10 second timeout
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))

                // Handle specific error codes
                if (response.status === 401) {
                    throw new ServiceError(
                        "INVALID_ACCESS_TOKEN",
                        "Access token is invalid or expired",
                        401,
                        { errorData }
                    )
                }

                if (response.status === 403) {
                    throw new ServiceError(
                        "INSUFFICIENT_PERMISSIONS",
                        "Access token does not have required permissions",
                        403,
                        { errorData }
                    )
                }

                if (response.status === 429) {
                    throw new ServiceError(
                        "RATE_LIMIT_EXCEEDED",
                        "YouTube API rate limit exceeded",
                        429,
                        { errorData, retryable: true }
                    )
                }

                if (response.status >= 500) {
                    throw new ServiceError(
                        "API_SERVER_ERROR",
                        `YouTube API server error: ${response.status}`,
                        response.status,
                        { errorData, retryable: true }
                    )
                }

                throw new ServiceError(
                    "API_ERROR",
                    `YouTube API error: ${response.status}`,
                    response.status,
                    { errorData }
                )
            }

            const data = await response.json()
            return data
        } catch (error) {
            if (error instanceof ServiceError) {
                throw error
            }

            throw new ServiceError(
                "API_CALL_FAILED",
                `Failed to call YouTube API: ${error instanceof Error ? error.message : "Unknown error"}`,
                500,
                {
                    originalError:
                        error instanceof Error ? error.message : String(error),
                }
            )
        }
    }

    /**
     * Check if error is retryable
     * @param error - Error to check
     * @returns True if error is retryable
     */
    private isRetryableError(error: unknown): boolean {
        if (error instanceof ServiceError) {
            // Retryable error codes
            const retryableCodes = [
                "RATE_LIMIT_EXCEEDED",
                "API_SERVER_ERROR",
                "API_CALL_FAILED",
            ]
            return retryableCodes.includes(error.code)
        }

        return false
    }

    /**
     * Check rate limiting for API calls
     * @param key - Rate limit key (e.g., user ID or IP)
     * @throws ServiceError if rate limit exceeded
     */
    private checkRateLimit(key: string): void {
        const now = Date.now()
        const state = this.rateLimitMap.get(key)

        if (!state) {
            // First request in this window
            this.rateLimitMap.set(key, {
                requestCount: 1,
                resetTime: now + this.RATE_LIMIT_WINDOW,
            })
            return
        }

        if (now > state.resetTime) {
            // Window has expired, reset counter
            this.rateLimitMap.set(key, {
                requestCount: 1,
                resetTime: now + this.RATE_LIMIT_WINDOW,
            })
            return
        }

        // Increment counter
        state.requestCount++

        if (state.requestCount > this.RATE_LIMIT_MAX_REQUESTS) {
            throw new ServiceError(
                "RATE_LIMIT_EXCEEDED",
                `Rate limit exceeded: ${this.RATE_LIMIT_MAX_REQUESTS} requests per ${this.RATE_LIMIT_WINDOW}ms`,
                429,
                {
                    requestCount: state.requestCount,
                    resetTime: state.resetTime,
                }
            )
        }
    }

    /**
     * Sleep for specified milliseconds
     * @param ms - Milliseconds to sleep
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Clear rate limit state (useful for testing)
     */
    clearRateLimitState(): void {
        this.rateLimitMap.clear()
    }

    /**
     * Get rate limit state for a key
     * @param key - Rate limit key
     * @returns Rate limit state or undefined
     */
    getRateLimitState(key: string): RateLimitState | undefined {
        return this.rateLimitMap.get(key)
    }
}

/**
 * Create a singleton instance of ChannelValidationService
 */
let channelValidationServiceInstance: ChannelValidationService | null = null

/**
 * Get or create the ChannelValidationService instance
 * @param config - YouTube Channel Linking configuration
 * @returns ChannelValidationService instance
 */
export function getChannelValidationService(
    config: YouTubeChannelLinkingConfig
): ChannelValidationService {
    if (!channelValidationServiceInstance) {
        channelValidationServiceInstance = new ChannelValidationService(config)
    }
    return channelValidationServiceInstance
}

/**
 * Reset the ChannelValidationService instance (useful for testing)
 */
export function resetChannelValidationService(): void {
    channelValidationServiceInstance = null
}
