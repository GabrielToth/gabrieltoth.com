/**
 * Content Adapter Service
 * Adapts content to meet platform-specific requirements
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */

import { createLogger } from "../logger"
import type { SocialPlatform } from "../networks"

const logger = createLogger("ContentAdapter")

/**
 * Platform-specific configuration
 */
interface PlatformConfig {
    maxCharacters: number
    maxImageSize: number // in bytes
    supportedImageFormats: string[]
    supportsVideo: boolean
    supportsLinks: boolean
    supportsHashtags: boolean
    supportsMentions: boolean
    supportsEmojis: boolean
    supportsAltText: boolean
    supportsDescription: boolean
}

/**
 * Platform configurations
 */
const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
    youtube: {
        maxCharacters: 5000,
        maxImageSize: 100 * 1024 * 1024, // 100MB
        supportedImageFormats: ["jpg", "jpeg", "png", "gif", "webp"],
        supportsVideo: true,
        supportsLinks: true,
        supportsHashtags: true,
        supportsMentions: true,
        supportsEmojis: true,
        supportsAltText: true,
        supportsDescription: true,
    },
    facebook: {
        maxCharacters: 63206,
        maxImageSize: 4 * 1024 * 1024, // 4MB
        supportedImageFormats: ["jpg", "jpeg", "png", "gif", "webp"],
        supportsVideo: true,
        supportsLinks: true,
        supportsHashtags: true,
        supportsMentions: true,
        supportsEmojis: true,
        supportsAltText: true,
        supportsDescription: false,
    },
    instagram: {
        maxCharacters: 2200,
        maxImageSize: 8 * 1024 * 1024, // 8MB
        supportedImageFormats: ["jpg", "jpeg", "png"],
        supportsVideo: true,
        supportsLinks: false,
        supportsHashtags: true,
        supportsMentions: true,
        supportsEmojis: true,
        supportsAltText: true,
        supportsDescription: false,
    },
    twitter: {
        maxCharacters: 280,
        maxImageSize: 5 * 1024 * 1024, // 5MB
        supportedImageFormats: ["jpg", "jpeg", "png", "gif", "webp"],
        supportsVideo: true,
        supportsLinks: true,
        supportsHashtags: true,
        supportsMentions: true,
        supportsEmojis: true,
        supportsAltText: true,
        supportsDescription: false,
    },
    linkedin: {
        maxCharacters: 3000,
        maxImageSize: 10 * 1024 * 1024, // 10MB
        supportedImageFormats: ["jpg", "jpeg", "png", "gif", "webp"],
        supportsVideo: true,
        supportsLinks: true,
        supportsHashtags: true,
        supportsMentions: true,
        supportsEmojis: true,
        supportsAltText: true,
        supportsDescription: true,
    },
}

/**
 * Content validation result
 */
export interface ContentValidationResult {
    isValid: boolean
    warnings: string[]
    errors: string[]
    adaptedContent?: string
    characterCount: number
    platformLimits: Record<SocialPlatform, PlatformConfig>
}

/**
 * Content Adapter
 * Handles platform-specific content adaptation and validation
 */
export class ContentAdapter {
    /**
     * Validate content for a single platform
     */
    validateForPlatform(
        content: string,
        platform: SocialPlatform
    ): ContentValidationResult {
        const config = PLATFORM_CONFIGS[platform]
        const warnings: string[] = []
        const errors: string[] = []
        const characterCount = content.length

        // Check character limit
        if (characterCount > config.maxCharacters) {
            errors.push(
                `Content exceeds ${platform} character limit of ${config.maxCharacters} characters (current: ${characterCount})`
            )
        } else if (characterCount > config.maxCharacters * 0.9) {
            warnings.push(
                `Content is approaching ${platform} character limit (${characterCount}/${config.maxCharacters})`
            )
        }

        // Check for unsupported features
        if (!config.supportsLinks && this.containsLinks(content)) {
            warnings.push(
                `${platform} may not support links in content. Consider using a different platform or removing links.`
            )
        }

        if (!config.supportsMentions && this.containsMentions(content)) {
            warnings.push(
                `${platform} may not support mentions. Consider using a different platform or removing mentions.`
            )
        }

        return {
            isValid: errors.length === 0,
            warnings,
            errors,
            characterCount,
            platformLimits: PLATFORM_CONFIGS,
        }
    }

    /**
     * Validate content for multiple platforms
     */
    validateForPlatforms(
        content: string,
        platforms: SocialPlatform[]
    ): Record<SocialPlatform, ContentValidationResult> {
        const results: Record<SocialPlatform, ContentValidationResult> =
            {} as any

        for (const platform of platforms) {
            results[platform] = this.validateForPlatform(content, platform)
        }

        return results
    }

    /**
     * Adapt content for a specific platform
     */
    adaptContent(
        content: string,
        platform: SocialPlatform
    ): { adapted: string; truncated: boolean } {
        const config = PLATFORM_CONFIGS[platform]

        if (content.length <= config.maxCharacters) {
            return { adapted: content, truncated: false }
        }

        // Truncate content to fit platform limit
        // Leave room for ellipsis
        const maxLength = config.maxCharacters - 3
        const adapted = content.substring(0, maxLength) + "..."

        logger.info("Content adapted for platform", {
            platform,
            originalLength: content.length,
            adaptedLength: adapted.length,
        })

        return { adapted, truncated: true }
    }

    /**
     * Validate image for a platform
     */
    validateImage(
        imageSize: number,
        imageFormat: string,
        platform: SocialPlatform
    ): { isValid: boolean; errors: string[] } {
        const config = PLATFORM_CONFIGS[platform]
        const errors: string[] = []

        // Check file size
        if (imageSize > config.maxImageSize) {
            errors.push(
                `Image size (${this.formatBytes(imageSize)}) exceeds ${platform} limit of ${this.formatBytes(config.maxImageSize)}`
            )
        }

        // Check file format
        const format = imageFormat.toLowerCase().replace(".", "")
        if (!config.supportedImageFormats.includes(format)) {
            errors.push(
                `Image format .${format} is not supported on ${platform}. Supported formats: ${config.supportedImageFormats.join(", ")}`
            )
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    /**
     * Get platform-specific character limit
     */
    getCharacterLimit(platform: SocialPlatform): number {
        return PLATFORM_CONFIGS[platform].maxCharacters
    }

    /**
     * Get all platform character limits
     */
    getAllCharacterLimits(): Record<SocialPlatform, number> {
        const limits: Record<SocialPlatform, number> = {} as any

        for (const [platform, config] of Object.entries(PLATFORM_CONFIGS)) {
            limits[platform as SocialPlatform] = config.maxCharacters
        }

        return limits
    }

    /**
     * Check if content contains links
     */
    private containsLinks(content: string): boolean {
        const urlRegex = /(https?:\/\/[^\s]+)/g
        return urlRegex.test(content)
    }

    /**
     * Check if content contains mentions
     */
    private containsMentions(content: string): boolean {
        const mentionRegex = /@\w+/g
        return mentionRegex.test(content)
    }

    /**
     * Format bytes to human-readable format
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return "0 Bytes"

        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    }
}

/**
 * Create a singleton Content Adapter instance
 */
let contentAdapterInstance: ContentAdapter | null = null

/**
 * Get or create the Content Adapter
 */
export function getContentAdapter(): ContentAdapter {
    if (!contentAdapterInstance) {
        contentAdapterInstance = new ContentAdapter()
    }
    return contentAdapterInstance
}

/**
 * Reset the Content Adapter (useful for testing)
 */
export function resetContentAdapter(): void {
    contentAdapterInstance = null
}
