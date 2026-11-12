/**
 * Platform capability matrix — single source of truth.
 *
 * The data lives in `platform-capabilities.data.json` so that the TypeScript
 * frontend/API and the Rust cloud core (`rust-core/src/capabilities.rs`) read
 * the exact same file. Changing a rule in one place therefore changes both.
 *
 * Reference: official API documentation of each platform (2026).
 */

import rawMatrix from "./platform-capabilities.data.json"

export type PlatformKey =
    | "youtube"
    | "facebook"
    | "instagram"
    | "twitch"
    | "kick"
    | "tiktok"
    | "linkedin"
    | "kwai"
    | "twitter" // X

export type PostContentType =
    | "text_only"
    | "image_text"
    | "short_video"
    | "long_video"

export type ExecutionEnvironment = "local" | "cloud"

export type LiveChatProtocol =
    | "websocket_irc"
    | "pusher_ws"
    | "rest_polling"
    | "webhook"
    | "emulated_cloud"
    | "none"

export interface LiveChatSupport {
    supported: boolean
    protocol: LiveChatProtocol
    allowedInLocal: boolean
    allowedInCloud: boolean
    officialApi: boolean
    notes?: string
}

export interface ContentTypeCapability {
    supported: boolean
    allowedInLocal: boolean
    allowedInCloud: boolean
    maxCharacters?: number
    maxFileSizeBytes?: number
    maxDurationSeconds?: number
    minDurationSeconds?: number
    notes?: string
}

export interface PlatformCapabilityDefinition {
    platform: PlatformKey
    displayName: string
    officialApiDocsUrl: string
    liveChat: LiveChatSupport
    capabilities: Record<PostContentType, ContentTypeCapability>
}

interface PlatformCapabilityMatrixFile {
    version: number
    platforms: Record<PlatformKey, PlatformCapabilityDefinition>
}

export const PLATFORM_CAPABILITY_MATRIX_VERSION = (
    rawMatrix as unknown as PlatformCapabilityMatrixFile
).version

export const PLATFORM_CAPABILITY_MATRIX: Record<
    PlatformKey,
    PlatformCapabilityDefinition
> = (rawMatrix as unknown as PlatformCapabilityMatrixFile).platforms

export const PLATFORM_KEYS: PlatformKey[] = [
    "youtube",
    "facebook",
    "instagram",
    "twitch",
    "kick",
    "tiktok",
    "linkedin",
    "kwai",
    "twitter",
]

export const POST_CONTENT_TYPES: PostContentType[] = [
    "text_only",
    "image_text",
    "short_video",
    "long_video",
]

const PLATFORM_ALIASES: Record<string, PlatformKey> = {
    x: "twitter",
    "x/twitter": "twitter",
    twitter: "twitter",
    youtube: "youtube",
    "youtube shorts": "youtube",
    facebook: "facebook",
    fb: "facebook",
    meta: "facebook",
    instagram: "instagram",
    ig: "instagram",
    twitch: "twitch",
    kick: "kick",
    tiktok: "tiktok",
    "tiktok business": "tiktok",
    linkedin: "linkedin",
    kwai: "kwai",
}

/**
 * Normalizes an arbitrary platform identifier (UI label, network id, alias)
 * into a matrix key. Returns `null` when the platform is not covered.
 */
export function normalizePlatformKey(value: string): PlatformKey | null {
    if (!value || typeof value !== "string") return null
    const normalized = value.trim().toLowerCase()
    if (normalized in PLATFORM_CAPABILITY_MATRIX) {
        return normalized as PlatformKey
    }
    return PLATFORM_ALIASES[normalized] ?? null
}

/**
 * Infers the content type from the assets present in a publish request.
 * Explicit callers should always prefer passing the real content type.
 */
export function inferContentType(params: {
    hasVideo?: boolean
    hasImages?: boolean
    durationSeconds?: number
}): PostContentType {
    if (params.hasVideo) {
        // A video over 3 minutes can no longer be a Short/Reel on most
        // platforms, so treat it as a regular (long) upload.
        return (params.durationSeconds ?? 0) > 180
            ? "long_video"
            : "short_video"
    }
    if (params.hasImages) return "image_text"
    return "text_only"
}

export interface CompatibilityCheckResult {
    platform: PlatformKey
    displayName: string
    isCompatible: boolean
    reasons: string[]
    recommendedAction?: string
}

/**
 * Validates a cross-platform publishing action according to the selected
 * execution environment (Local vs Cloud).
 */
export function validateCrossPlatformPublishing(params: {
    platforms: PlatformKey[]
    contentType: PostContentType
    environment: ExecutionEnvironment
    characterCount?: number
    fileSizeBytes?: number
    durationSeconds?: number
}): {
    allValid: boolean
    results: Record<PlatformKey, CompatibilityCheckResult>
    compatiblePlatforms: PlatformKey[]
    incompatiblePlatforms: PlatformKey[]
} {
    const results: Partial<Record<PlatformKey, CompatibilityCheckResult>> = {}
    let allValid = true
    const compatiblePlatforms: PlatformKey[] = []
    const incompatiblePlatforms: PlatformKey[] = []

    for (const plat of params.platforms) {
        const def = PLATFORM_CAPABILITY_MATRIX[plat]
        if (!def) {
            results[plat] = {
                platform: plat,
                displayName: plat,
                isCompatible: false,
                reasons: [`Plataforma desconhecida: ${plat}`],
            }
            allValid = false
            incompatiblePlatforms.push(plat)
            continue
        }

        const cap = def.capabilities[params.contentType]
        const reasons: string[] = []

        // 1. General support for the format
        if (!cap || !cap.supported) {
            reasons.push(
                cap?.notes ||
                    `A plataforma ${def.displayName} não oferece suporte ao formato "${params.contentType}".`
            )
        }

        // 2. Execution mode validation (Local vs Cloud)
        if (params.environment === "local" && cap && !cap.allowedInLocal) {
            reasons.push(
                "Requer modo CLOUD: a API oficial exige credenciais confidenciais ou não oferece CORS/chaves públicas."
            )
        }

        // 3. Character limits
        if (cap && cap.maxCharacters != null && params.characterCount != null) {
            if (params.characterCount > cap.maxCharacters) {
                reasons.push(
                    `Texto de ${params.characterCount} caracteres excede o limite máximo de ${cap.maxCharacters}.`
                )
            }
        }

        // 4. File size limits
        if (
            cap &&
            cap.maxFileSizeBytes != null &&
            params.fileSizeBytes != null
        ) {
            if (params.fileSizeBytes > cap.maxFileSizeBytes) {
                const mbGiven = (params.fileSizeBytes / (1024 * 1024)).toFixed(
                    1
                )
                const mbMax = (cap.maxFileSizeBytes / (1024 * 1024)).toFixed(0)
                reasons.push(
                    `Arquivo com ${mbGiven}MB excede o limite máximo permitido de ${mbMax}MB.`
                )
            }
        }

        // 5. Duration limits
        if (cap && params.durationSeconds != null) {
            if (
                cap.maxDurationSeconds != null &&
                params.durationSeconds > cap.maxDurationSeconds
            ) {
                reasons.push(
                    `Duração de ${params.durationSeconds}s excede o tempo limite de ${cap.maxDurationSeconds}s.`
                )
            }
            if (
                cap.minDurationSeconds != null &&
                params.durationSeconds < cap.minDurationSeconds
            ) {
                reasons.push(
                    `Duração de ${params.durationSeconds}s é menor que o tempo mínimo exigido de ${cap.minDurationSeconds}s.`
                )
            }
        }

        const isCompatible = reasons.length === 0
        if (!isCompatible) {
            allValid = false
            incompatiblePlatforms.push(plat)
        } else {
            compatiblePlatforms.push(plat)
        }

        results[plat] = {
            platform: plat,
            displayName: def.displayName,
            isCompatible,
            reasons,
            recommendedAction:
                !isCompatible &&
                cap?.allowedInCloud &&
                params.environment === "local"
                    ? "Mudar para modo Cloud para postar nesta rede."
                    : undefined,
        }
    }

    return {
        allValid,
        results: results as Record<PlatformKey, CompatibilityCheckResult>,
        compatiblePlatforms,
        incompatiblePlatforms,
    }
}
