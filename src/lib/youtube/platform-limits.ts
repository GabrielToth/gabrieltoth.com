/**
 * Platform-specific upload limits for video publishing.
 * Used by the UI to show constraints before upload and by the server to validate.
 */

export interface PlatformLimits {
    maxFileSizeBytes: number
    maxDurationSeconds: number
    minDurationSeconds: number
    supportedCodecs: string[]
    maxResolution: string
    description: string
}

export const PLATFORM_LIMITS: Record<string, PlatformLimits> = {
    youtube: {
        maxFileSizeBytes: 256 * 1024 * 1024 * 1024, // 256GB
        maxDurationSeconds: 432000, // 12 hours
        minDurationSeconds: 33, // 33 seconds
        supportedCodecs: ["h264", "vp9", "av1"],
        maxResolution: "8K",
        description: "YouTube supports up to 12 hours and 256GB",
    },
    tiktok: {
        maxFileSizeBytes: 500 * 1024 * 1024, // 500MB
        maxDurationSeconds: 600, // 10 minutes
        minDurationSeconds: 1,
        supportedCodecs: ["h264"],
        maxResolution: "1080p",
        description: "TikTok supports up to 10 minutes and 500MB",
    },
    instagram: {
        maxFileSizeBytes: 650 * 1024 * 1024, // 650MB (carousel) / 100MB (single)
        maxDurationSeconds: 3600, // 60 minutes
        minDurationSeconds: 3,
        supportedCodecs: ["h264"],
        maxResolution: "4K",
        description: "Instagram supports up to 60 minutes and 650MB",
    },
    facebook: {
        maxFileSizeBytes: 10 * 1024 * 1024 * 1024, // 10GB
        maxDurationSeconds: 14400, // 4 hours
        minDurationSeconds: 1,
        supportedCodecs: ["h264", "vp9"],
        maxResolution: "4K",
        description: "Facebook supports up to 4 hours and 10GB",
    },
}

export function getPlatformLimit(platform: string): PlatformLimits | undefined {
    return PLATFORM_LIMITS[platform.toLowerCase()]
}

export function validateVideoForPlatform(
    platform: string,
    fileSizeBytes: number,
    durationSeconds: number
): { valid: boolean; errors: string[] } {
    const limits = getPlatformLimit(platform)
    if (!limits) {
        return { valid: false, errors: [`Unsupported platform: ${platform}`] }
    }

    const errors: string[] = []

    if (fileSizeBytes > limits.maxFileSizeBytes) {
        errors.push(
            `File size ${(fileSizeBytes / 1024 / 1024).toFixed(1)}MB exceeds ${platform} limit of ${(limits.maxFileSizeBytes / 1024 / 1024).toFixed(0)}MB`
        )
    }

    if (durationSeconds > limits.maxDurationSeconds) {
        errors.push(
            `Duration ${Math.floor(durationSeconds / 60)}min exceeds ${platform} limit of ${Math.floor(limits.maxDurationSeconds / 60)}min`
        )
    }

    if (durationSeconds < limits.minDurationSeconds) {
        errors.push(
            `Duration ${durationSeconds}s is below ${platform} minimum of ${limits.minDurationSeconds}s`
        )
    }

    return { valid: errors.length === 0, errors }
}
