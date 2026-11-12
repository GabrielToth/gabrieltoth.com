/**
 * Server-side publish guard.
 *
 * Enforces the shared platform capability matrix on the server (CLOUD path)
 * and guarantees that LOCAL execution never reaches our backend.
 *
 * Contract:
 * - `environment: "local"` requests MUST NOT be processed here. They are
 *   rejected with `LOCAL_MODE_NOT_ALLOWED` so no credits are charged and no
 *   user credential ever touches our infrastructure.
 * - CLOUD requests are validated against the same matrix used by the UI.
 */

import {
    inferContentType,
    normalizePlatformKey,
    validateCrossPlatformPublishing,
    type ExecutionEnvironment,
    type PlatformKey,
    type PostContentType,
} from "./platform-capabilities"

export const ERROR_LOCAL_MODE_ON_SERVER = "LOCAL_MODE_NOT_ALLOWED"
export const ERROR_PLATFORM_NOT_SUPPORTED = "PLATFORM_NOT_SUPPORTED"
export const ERROR_INCOMPATIBLE_CONTENT = "INCOMPATIBLE_CONTENT"

export interface PublishValidationInput {
    platforms: string[]
    contentType?: PostContentType
    /**
     * When the exact format is not known (e.g. a scheduled video of unknown
     * duration), the request is accepted if any candidate format is valid.
     */
    contentTypeCandidates?: PostContentType[]
    environment?: ExecutionEnvironment
    characterCount?: number
    fileSizeBytes?: number
    durationSeconds?: number
    hasVideo?: boolean
    hasImages?: boolean
}

export interface PublishValidationIssue {
    platform: string
    reasons: string[]
    recommendedAction?: string
}

export interface PublishValidationResult {
    ok: boolean
    environment: ExecutionEnvironment
    contentType: PostContentType
    platforms: PlatformKey[]
    unknownPlatforms: string[]
    compatiblePlatforms: PlatformKey[]
    incompatiblePlatforms: PlatformKey[]
    issues: PublishValidationIssue[]
}

/**
 * True when a request explicitly asks for LOCAL execution. Such a request
 * must be rejected by the backend and handled in the browser instead.
 */
export function isLocalExecutionRequest(mode: unknown): boolean {
    return typeof mode === "string" && mode.trim().toLowerCase() === "local"
}

/**
 * Validates a publish request. Neutral input (no mode) is treated as CLOUD,
 * which is the backend default.
 */
export function validatePublishRequest(
    input: PublishValidationInput
): PublishValidationResult {
    const environment = input.environment ?? "cloud"

    const platforms: PlatformKey[] = []
    const unknownPlatforms: string[] = []

    for (const raw of input.platforms) {
        const key = normalizePlatformKey(raw)
        if (key) {
            if (!platforms.includes(key)) platforms.push(key)
        } else {
            unknownPlatforms.push(raw)
        }
    }

    const candidates: PostContentType[] = input.contentType
        ? [input.contentType]
        : input.contentTypeCandidates && input.contentTypeCandidates.length > 0
          ? input.contentTypeCandidates
          : [
                inferContentType({
                    hasVideo: input.hasVideo,
                    hasImages: input.hasImages,
                    durationSeconds: input.durationSeconds,
                }),
            ]

    let lastResult: PublishValidationResult | null = null
    for (const contentType of candidates) {
        const result = runValidation(
            platforms,
            unknownPlatforms,
            contentType,
            environment,
            input
        )
        if (result.ok) return result
        lastResult = result
    }

    // `candidates` is never empty, so this is always assigned.
    return lastResult as PublishValidationResult
}

function runValidation(
    platforms: PlatformKey[],
    unknownPlatforms: string[],
    contentType: PostContentType,
    environment: ExecutionEnvironment,
    input: PublishValidationInput
): PublishValidationResult {
    const validation = validateCrossPlatformPublishing({
        platforms,
        contentType,
        environment,
        characterCount: input.characterCount,
        fileSizeBytes: input.fileSizeBytes,
        durationSeconds: input.durationSeconds,
    })

    const issues: PublishValidationIssue[] = Object.values(validation.results)
        .filter(result => !result.isCompatible)
        .map(result => ({
            platform: result.platform,
            reasons: result.reasons,
            recommendedAction: result.recommendedAction,
        }))

    for (const raw of unknownPlatforms) {
        issues.push({
            platform: raw,
            reasons: [
                `Plataforma não reconhecida pela matriz oficial: "${raw}".`,
            ],
        })
    }

    return {
        ok: issues.length === 0 && platforms.length > 0 && validation.allValid,
        environment,
        contentType,
        platforms,
        unknownPlatforms,
        compatiblePlatforms: validation.compatiblePlatforms,
        incompatiblePlatforms: validation.incompatiblePlatforms,
        issues,
    }
}

/**
 * Matches a platform name to the publish endpoint that owns it. Used by the
 * UI to decide between the backend (CLOUD) and the browser (LOCAL) path.
 */
export function getCloudPublishPath(platform: PlatformKey): string {
    return `/api/platform/${platform}/publish`
}
