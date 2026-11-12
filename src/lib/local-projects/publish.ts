/**
 * LOCAL publishing executor.
 *
 * ZERO-BACKEND BY CONSTRUCTION:
 * Nothing in this module calls our own API routes. It validates against the
 * shared capability matrix and then talks directly from the browser to the
 * platform API with the user's own credentials.
 *
 * When a platform officially allows LOCAL but its browser adapter is not
 * implemented yet, the call fails closed with `LOCAL_ADAPTER_REQUIRED`
 * instead of silently falling back to the backend.
 */

import {
    inferContentType,
    normalizePlatformKey,
    type PlatformKey,
    type PostContentType,
} from "../posting/platform-capabilities"
import { validatePublishRequest } from "../posting/publish-guard"
import { LocalPlatformApiClient } from "./client"
import { getLocalChannelById } from "./storage"
import type { PlatformType } from "./types"

export type LocalPublishAction =
    "twitter_text" | "youtube_resumable_upload" | "unsupported"

export type LocalPublishErrorCode =
    | "PLATFORM_NOT_SUPPORTED"
    | "INCOMPATIBLE_CONTENT"
    | "LOCAL_CHANNEL_REQUIRED"
    | "LOCAL_ADAPTER_REQUIRED"
    | "LOCAL_PUBLISH_FAILED"

export interface LocalPublishInput {
    platform: string
    channelId?: string
    text?: string
    hasVideo?: boolean
    hasImages?: boolean
    videoFile?: { size: number; type?: string }
    durationSeconds?: number
    fileSizeBytes?: number
    characterCount?: number
    contentType?: PostContentType
}

export interface LocalPublishSuccess {
    ok: true
    platform: PlatformKey
    contentType: PostContentType
    action: LocalPublishAction
    postId?: string
    url?: string
}

export interface LocalPublishFailure {
    ok: false
    platform: string
    code: LocalPublishErrorCode
    reasons: string[]
}

export type LocalPublishPlan = LocalPublishSuccess | LocalPublishFailure

const LOCAL_PLATFORM_TYPE: Partial<Record<PlatformKey, PlatformType>> = {
    youtube: "youtube",
    facebook: "meta",
    instagram: "meta",
    twitch: "twitch",
    kick: "kick",
    tiktok: "tiktok",
    twitter: "twitter",
    linkedin: "linkedin",
    kwai: "kwai",
}

function resolveAction(
    platform: PlatformKey,
    contentType: PostContentType
): LocalPublishAction {
    if (platform === "twitter" && contentType === "text_only") {
        return "twitter_text"
    }
    if (
        platform === "youtube" &&
        (contentType === "short_video" || contentType === "long_video")
    ) {
        return "youtube_resumable_upload"
    }
    return "unsupported"
}

/**
 * Pure planner: decides whether a LOCAL publish is allowed and which browser
 * adapter must execute it. Contains no network access, so it is fully testable.
 */
export function planLocalPublish(input: LocalPublishInput): LocalPublishPlan {
    const platform = normalizePlatformKey(input.platform)
    if (!platform) {
        return {
            ok: false,
            platform: input.platform,
            code: "PLATFORM_NOT_SUPPORTED",
            reasons: [
                `Plataforma não reconhecida pela matriz oficial: "${input.platform}".`,
            ],
        }
    }

    const contentType =
        input.contentType ??
        inferContentType({
            hasVideo: input.hasVideo,
            hasImages: input.hasImages,
            durationSeconds: input.durationSeconds,
        })

    const validation = validatePublishRequest({
        platforms: [platform],
        environment: "local",
        contentType,
        characterCount: input.characterCount,
        fileSizeBytes: input.fileSizeBytes,
        durationSeconds: input.durationSeconds,
    })

    if (!validation.ok) {
        return {
            ok: false,
            platform,
            code: "INCOMPATIBLE_CONTENT",
            reasons: validation.issues.flatMap(issue => issue.reasons),
        }
    }

    const action = resolveAction(platform, contentType)
    if (action === "unsupported") {
        return {
            ok: false,
            platform,
            code: "LOCAL_ADAPTER_REQUIRED",
            reasons: [
                `A matriz permite ${platform}/${contentType} em LOCAL, mas o adaptador direto no navegador ainda não foi implementado para este formato. Nada foi enviado ao backend.`,
            ],
        }
    }

    return { ok: true, platform, contentType, action }
}

/**
 * Executes a LOCAL publish entirely in the browser.
 */
export async function publishLocally(
    input: LocalPublishInput
): Promise<LocalPublishPlan> {
    const plan = planLocalPublish(input)
    if (!plan.ok) return plan

    const platformType = LOCAL_PLATFORM_TYPE[plan.platform]
    if (!platformType) {
        return {
            ok: false,
            platform: plan.platform,
            code: "LOCAL_ADAPTER_REQUIRED",
            reasons: [
                `Sem mapeamento de projeto LOCAL para ${plan.platform}. Nada foi enviado ao backend.`,
            ],
        }
    }

    if (!input.channelId) {
        return {
            ok: false,
            platform: plan.platform,
            code: "LOCAL_CHANNEL_REQUIRED",
            reasons: [
                "Selecione um canal LOCAL vinculado (com tokens do seu projeto) para publicar sem backend.",
            ],
        }
    }

    if (plan.action === "twitter_text") {
        const text = input.text?.trim()
        if (!text) {
            return {
                ok: false,
                platform: plan.platform,
                code: "INCOMPATIBLE_CONTENT",
                reasons: ["Texto vazio não pode ser publicado."],
            }
        }

        const result = await LocalPlatformApiClient.execute<{
            data?: { id?: string }
        }>("twitter", {
            channelId: input.channelId,
            endpoint: "https://api.x.com/2/tweets",
            method: "POST",
            bucket: "write_requests",
            body: { text },
        })

        if (!result.ok) {
            return {
                ok: false,
                platform: plan.platform,
                code: "LOCAL_PUBLISH_FAILED",
                reasons: [
                    result.error ||
                        "Falha ao publicar diretamente na API do X usando suas chaves locais.",
                ],
            }
        }

        const tweetId = result.data?.data?.id
        return {
            ok: true,
            platform: plan.platform,
            contentType: plan.contentType,
            action: plan.action,
            postId: tweetId,
            url: tweetId ? `https://x.com/i/web/status/${tweetId}` : undefined,
        }
    }

    if (plan.action === "youtube_resumable_upload") {
        return publishYouTubeLocally(input, plan)
    }

    return {
        ok: false,
        platform: plan.platform,
        code: "LOCAL_ADAPTER_REQUIRED",
        reasons: [
            `Adaptador LOCAL não disponível para ${plan.platform}/${plan.contentType}.`,
        ],
    }
}

async function publishYouTubeLocally(
    input: LocalPublishInput,
    plan: LocalPublishSuccess
): Promise<LocalPublishPlan> {
    const file = input.videoFile
    if (!file || file.size === 0) {
        return {
            ok: false,
            platform: plan.platform,
            code: "INCOMPATIBLE_CONTENT",
            reasons: ["YouTube exige um arquivo de vídeo."],
        }
    }

    const binding = getLocalChannelById(input.channelId as string, "youtube")
    const auth = binding?.auths.find(a => Boolean(a.accessToken))
    if (!binding || !auth?.accessToken) {
        return {
            ok: false,
            platform: plan.platform,
            code: "LOCAL_CHANNEL_REQUIRED",
            reasons: [
                "Nenhum token LOCAL do YouTube encontrado para este canal. Vincule o canal ao seu projeto Google antes de publicar.",
            ],
        }
    }

    const description = input.text?.trim() || ""
    const title = description.split("\n")[0].slice(0, 100) || "Video upload"
    const mime = file.type || "video/*"

    try {
        const initResponse = await fetch(
            "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${auth.accessToken}`,
                    "Content-Type": "application/json",
                    "X-Upload-Content-Type": mime,
                    "X-Upload-Content-Length": String(file.size),
                },
                body: JSON.stringify({
                    snippet: { title, description },
                    status: { privacyStatus: "unlisted" },
                }),
            }
        )

        if (!initResponse.ok) {
            const detail = await initResponse.text()
            return {
                ok: false,
                platform: plan.platform,
                code: "LOCAL_PUBLISH_FAILED",
                reasons: [
                    `YouTube recusou a sessão de upload (${initResponse.status}): ${detail.slice(0, 300)}`,
                ],
            }
        }

        const uploadUrl = initResponse.headers.get("Location")
        if (!uploadUrl) {
            return {
                ok: false,
                platform: plan.platform,
                code: "LOCAL_PUBLISH_FAILED",
                reasons: ["YouTube não retornou a URL de upload resumable."],
            }
        }

        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": mime },
            // The File object is streamed by the browser directly.
            body: file as unknown as BodyInit,
        })

        if (!uploadResponse.ok) {
            const detail = await uploadResponse.text()
            return {
                ok: false,
                platform: plan.platform,
                code: "LOCAL_PUBLISH_FAILED",
                reasons: [
                    `Upload para o YouTube falhou (${uploadResponse.status}): ${detail.slice(0, 300)}`,
                ],
            }
        }

        const uploaded = (await uploadResponse.json()) as { id?: string }
        return {
            ok: true,
            platform: plan.platform,
            contentType: plan.contentType,
            action: plan.action,
            postId: uploaded.id,
            url: uploaded.id
                ? `https://www.youtube.com/watch?v=${uploaded.id}`
                : undefined,
        }
    } catch (error) {
        return {
            ok: false,
            platform: plan.platform,
            code: "LOCAL_PUBLISH_FAILED",
            reasons: [
                error instanceof Error
                    ? error.message
                    : "Falha de rede ao publicar diretamente no YouTube.",
            ],
        }
    }
}
