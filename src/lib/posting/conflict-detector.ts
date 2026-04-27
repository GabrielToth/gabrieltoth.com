/**
 * Conflict Detector Service
 * Detects scheduling conflicts and platform incompatibilities
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8
 */

import { createLogger } from "../logger"
import type { SocialPlatform } from "../networks"
import { getNetworkManager } from "../networks"
import { getContentAdapter } from "./content-adapter"

const logger = createLogger("ConflictDetector")

/**
 * Conflict type
 */
export type ConflictType =
    | "scheduling_conflict"
    | "content_limit"
    | "authentication_expired"
    | "platform_incompatibility"
    | "unsupported_feature"

/**
 * Conflict
 */
export interface Conflict {
    type: ConflictType
    platform?: SocialPlatform
    message: string
    severity: "warning" | "error"
    resolution?: string
}

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
    hasConflicts: boolean
    conflicts: Conflict[]
    canPublish: boolean
}

/**
 * Conflict Detector
 * Detects scheduling conflicts and platform incompatibilities
 */
export class ConflictDetector {
    private networkManager = getNetworkManager()
    private contentAdapter = getContentAdapter()

    /**
     * Detect conflicts for a post
     */
    async detectConflicts(
        userId: string,
        content: string,
        platforms: SocialPlatform[],
        scheduledTime?: number
    ): Promise<ConflictDetectionResult> {
        const conflicts: Conflict[] = []

        // Check authentication status
        const authConflicts = await this.checkAuthenticationStatus(
            userId,
            platforms
        )
        conflicts.push(...authConflicts)

        // Check content limits
        const contentConflicts = this.checkContentLimits(content, platforms)
        conflicts.push(...contentConflicts)

        // Check scheduling conflicts
        if (scheduledTime) {
            const schedulingConflicts = await this.checkSchedulingConflicts(
                userId,
                scheduledTime,
                platforms
            )
            conflicts.push(...schedulingConflicts)
        }

        // Check platform incompatibilities
        const incompatibilityConflicts = this.checkPlatformIncompatibilities(
            content,
            platforms
        )
        conflicts.push(...incompatibilityConflicts)

        const hasConflicts = conflicts.length > 0
        const hasErrors = conflicts.some(c => c.severity === "error")

        logger.info("Conflict detection completed", {
            userId,
            platforms,
            conflictCount: conflicts.length,
            hasErrors,
        })

        return {
            hasConflicts,
            conflicts,
            canPublish: !hasErrors,
        }
    }

    /**
     * Check authentication status for platforms
     */
    private async checkAuthenticationStatus(
        userId: string,
        platforms: SocialPlatform[]
    ): Promise<Conflict[]> {
        const conflicts: Conflict[] = []

        for (const platform of platforms) {
            try {
                const status = await this.networkManager.checkNetworkStatus(
                    userId,
                    platform
                )

                if (status === "disconnected") {
                    conflicts.push({
                        type: "authentication_expired",
                        platform,
                        message: `${platform} is not connected. Please link your account first.`,
                        severity: "error",
                        resolution: `Go to settings and connect your ${platform} account`,
                    })
                } else if (status === "expired") {
                    conflicts.push({
                        type: "authentication_expired",
                        platform,
                        message: `Your ${platform} authentication has expired. Please re-authenticate.`,
                        severity: "error",
                        resolution: `Re-authenticate your ${platform} account in settings`,
                    })
                }
            } catch (error) {
                logger.error("Failed to check authentication status", {
                    userId,
                    platform,
                    error:
                        error instanceof Error ? error.message : String(error),
                })

                conflicts.push({
                    type: "authentication_expired",
                    platform,
                    message: `Failed to verify ${platform} authentication status`,
                    severity: "warning",
                })
            }
        }

        return conflicts
    }

    /**
     * Check content limits for platforms
     */
    private checkContentLimits(
        content: string,
        platforms: SocialPlatform[]
    ): Conflict[] {
        const conflicts: Conflict[] = []

        for (const platform of platforms) {
            const validation = this.contentAdapter.validateForPlatform(
                content,
                platform
            )

            for (const error of validation.errors) {
                conflicts.push({
                    type: "content_limit",
                    platform,
                    message: error,
                    severity: "error",
                    resolution: `Reduce content length or remove ${platform} from selected platforms`,
                })
            }

            for (const warning of validation.warnings) {
                conflicts.push({
                    type: "content_limit",
                    platform,
                    message: warning,
                    severity: "warning",
                })
            }
        }

        return conflicts
    }

    /**
     * Check scheduling conflicts
     */
    private async checkSchedulingConflicts(
        userId: string,
        scheduledTime: number,
        platforms: SocialPlatform[]
    ): Promise<Conflict[]> {
        const conflicts: Conflict[] = []

        // Check if scheduled time is in the past
        if (scheduledTime < Date.now()) {
            conflicts.push({
                type: "scheduling_conflict",
                message:
                    "Scheduled time is in the past. Please select a future time.",
                severity: "error",
                resolution: "Select a future date and time",
            })
        }

        // Check if scheduled time is too far in the future (> 365 days)
        const maxFutureTime = Date.now() + 365 * 24 * 60 * 60 * 1000
        if (scheduledTime > maxFutureTime) {
            conflicts.push({
                type: "scheduling_conflict",
                message: "Scheduled time is more than 365 days in the future.",
                severity: "warning",
                resolution: "Select a date within 365 days",
            })
        }

        return conflicts
    }

    /**
     * Check platform incompatibilities
     */
    private checkPlatformIncompatibilities(
        content: string,
        platforms: SocialPlatform[]
    ): Conflict[] {
        const conflicts: Conflict[] = []

        // Check for links on Instagram
        if (platforms.includes("instagram") && this.containsLinks(content)) {
            conflicts.push({
                type: "platform_incompatibility",
                platform: "instagram",
                message:
                    "Instagram does not support clickable links in captions. Links will be displayed as text.",
                severity: "warning",
                resolution:
                    "Add link to Instagram bio or remove from Instagram selection",
            })
        }

        // Check for mentions on platforms that don't support them
        if (this.containsMentions(content)) {
            for (const platform of platforms) {
                if (platform === "twitter" || platform === "facebook") {
                    // These support mentions, skip
                    continue
                }

                conflicts.push({
                    type: "unsupported_feature",
                    platform,
                    message: `${platform} may not properly format mentions. Consider removing or reformatting.`,
                    severity: "warning",
                })
            }
        }

        return conflicts
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
}

/**
 * Create a singleton Conflict Detector instance
 */
let conflictDetectorInstance: ConflictDetector | null = null

/**
 * Get or create the Conflict Detector
 */
export function getConflictDetector(): ConflictDetector {
    if (!conflictDetectorInstance) {
        conflictDetectorInstance = new ConflictDetector()
    }
    return conflictDetectorInstance
}

/**
 * Reset the Conflict Detector (useful for testing)
 */
export function resetConflictDetector(): void {
    conflictDetectorInstance = null
}
