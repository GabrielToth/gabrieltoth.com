/**
 * BYO Token → Channel Resolver
 *
 * Given a user-supplied access token, queries the platform's official API and
 * returns EVERY channel/account the token can act on. This powers the "Local
 * Mode" flow: a non-paying user pastes their own token and immediately sees
 * which channels they can then authenticate/manage — for all social networks.
 *
 * Design goals:
 *  - Official APIs only (compliance: no scraping).
 *  - Never persist the token; it is used in-memory for a single listing call.
 *  - Fail soft per platform: one bad token never breaks the others.
 *  - Return a standardized shape so the UI can render a uniform channel picker.
 */

import { createLogger } from "@/lib/logger"

const logger = createLogger("ByoChannelResolver")

export type ByoPlatform =
    | "youtube"
    | "twitch"
    | "kick"
    | "facebook"
    | "instagram"
    | "linkedin"
    | "tiktok"
    | "twitter"

export interface ResolvedChannel {
    /** Stable platform-side id (channel/user/page id). */
    id: string
    /** Human name shown in the picker. */
    name: string
    /** Avatar/thumbnail URL when the platform exposes one. */
    avatarUrl?: string
    /** Optional secondary line (subscriber/follower count, handle, etc.). */
    detail?: string
    /** Extra platform-specific data (e.g. the page access token for FB). */
    meta?: Record<string, unknown>
}

export interface ResolveResult {
    platform: ByoPlatform
    ok: boolean
    channels: ResolvedChannel[]
    /** Machine-readable failure code when ok === false. */
    error?: string
    /** Human-readable hint (never leaks the token). */
    message?: string
}

export interface ResolveInput {
    platform: ByoPlatform
    accessToken: string
    /**
     * Twitch (and, for some apps, Kick) require a Client-Id header alongside
     * the bearer token. Optional for platforms that don't need it.
     */
    clientId?: string
}

const TIMEOUT_MS = 12000

async function getJson(
    url: string,
    headers: Record<string, string>
): Promise<{ ok: boolean; status: number; data: unknown }> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
        const res = await fetch(url, {
            headers,
            signal: controller.signal,
        })
        const text = await res.text()
        let data: unknown = null
        try {
            data = text ? JSON.parse(text) : null
        } catch {
            data = text
        }
        return { ok: res.ok, status: res.status, data }
    } finally {
        clearTimeout(timer)
    }
}

/** Redact anything that could be the token from messages. */
function safeError(status: number): { error: string; message: string } {
    if (status === 401 || status === 403) {
        return {
            error: "INVALID_TOKEN",
            message: "Token inválido ou sem permissão para listar canais.",
        }
    }
    if (status === 429) {
        return {
            error: "RATE_LIMITED",
            message: "Limite de requisições atingido. Tente novamente.",
        }
    }
    return {
        error: "PLATFORM_ERROR",
        message: `A API respondeu com status ${status}.`,
    }
}

// ---------------------------------------------------------------------------
// Per-platform resolvers
// ---------------------------------------------------------------------------

async function resolveYouTube(token: string): Promise<ResolvedChannel[]> {
    const { ok, status, data } = await getJson(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
        { Authorization: `Bearer ${token}`, Accept: "application/json" }
    )
    if (!ok) throw { status }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = (data as any)?.items || []
    return items.map(ch => ({
        id: ch.id,
        name: ch.snippet?.title || ch.id,
        avatarUrl: ch.snippet?.thumbnails?.default?.url,
        detail: ch.statistics?.subscriberCount
            ? `${Number(ch.statistics.subscriberCount).toLocaleString()} inscritos`
            : ch.snippet?.customUrl,
    }))
}

async function resolveTwitch(
    token: string,
    clientId?: string
): Promise<ResolvedChannel[]> {
    if (!clientId) {
        throw {
            status: 400,
            error: "CLIENT_ID_REQUIRED",
            message:
                "O Twitch exige o Client-Id junto ao token. Informe o Client-Id da sua aplicação Twitch.",
        }
    }
    const { ok, status, data } = await getJson(
        "https://api.twitch.tv/helix/users",
        {
            Authorization: `Bearer ${token}`,
            "Client-Id": clientId,
            Accept: "application/json",
        }
    )
    if (!ok) throw { status }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = (data as any)?.data || []
    return items.map(u => ({
        id: u.id,
        name: u.display_name || u.login,
        avatarUrl: u.profile_image_url,
        detail: u.login ? `@${u.login}` : undefined,
    }))
}

async function resolveKick(token: string): Promise<ResolvedChannel[]> {
    const { ok, status, data } = await getJson(
        "https://api.kick.com/public/v1/users",
        { Authorization: `Bearer ${token}`, Accept: "application/json" }
    )
    if (!ok) throw { status }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = Array.isArray(body)
        ? body
        : body?.data || body?.users || []
    return items.map(u => ({
        id: String(u.user_id ?? u.id ?? u.slug),
        name: u.name || u.username || u.slug || String(u.id),
        avatarUrl: u.profile_picture || u.profile_pic,
    }))
}

async function resolveFacebook(token: string): Promise<ResolvedChannel[]> {
    const { ok, status, data } = await getJson(
        "https://graph.facebook.com/v25.0/me/accounts?limit=100&fields=id,name,picture,access_token,followers_count",
        { Authorization: `Bearer ${token}`, Accept: "application/json" }
    )
    if (!ok) throw { status }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = (data as any)?.data || []
    return items.map(p => ({
        id: p.id,
        name: p.name,
        avatarUrl: p.picture?.data?.url,
        detail: p.followers_count
            ? `${Number(p.followers_count).toLocaleString()} seguidores`
            : undefined,
        meta: { pageAccessToken: p.access_token },
    }))
}

async function resolveInstagram(token: string): Promise<ResolvedChannel[]> {
    // Instagram Business accounts are reached through the linked Facebook Page.
    const { ok, status, data } = await getJson(
        "https://graph.facebook.com/v25.0/me/accounts?limit=100&fields=id,name,instagram_business_account{id,username,profile_picture_url,followers_count},picture",
        { Authorization: `Bearer ${token}`, Accept: "application/json" }
    )
    if (!ok) throw { status }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages: any[] = (data as any)?.data || []
    return (
        pages
            .filter(p => p.instagram_business_account)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((p: any) => {
                const ig = p.instagram_business_account
                return {
                    id: ig.id,
                    name: ig.username ? `@${ig.username}` : p.name,
                    avatarUrl: ig.profile_picture_url || p.picture?.data?.url,
                    detail: ig.followers_count
                        ? `${Number(ig.followers_count).toLocaleString()} seguidores`
                        : `Página: ${p.name}`,
                    meta: { facebookPageId: p.id, facebookPageName: p.name },
                }
            })
    )
}

async function resolveLinkedIn(token: string): Promise<ResolvedChannel[]> {
    const { ok, status, data } = await getJson(
        "https://api.linkedin.com/v2/userinfo",
        { Authorization: `Bearer ${token}`, Accept: "application/json" }
    )
    if (!ok) throw { status }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u: any = data
    if (!u?.sub) return []
    return [
        {
            id: u.sub,
            name:
                u.name || `${u.given_name ?? ""} ${u.family_name ?? ""}`.trim(),
            avatarUrl: u.picture,
        },
    ]
}

async function resolveTikTok(token: string): Promise<ResolvedChannel[]> {
    const { ok, status, data } = await getJson(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name,avatar_url,follower_count",
        { Authorization: `Bearer ${token}`, Accept: "application/json" }
    )
    if (!ok) throw { status }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u: any = (data as any)?.data?.user
    if (!u) return []
    return [
        {
            id: u.open_id || u.union_id,
            name: u.display_name || u.open_id,
            avatarUrl: u.avatar_url,
            detail: u.follower_count
                ? `${Number(u.follower_count).toLocaleString()} seguidores`
                : undefined,
        },
    ]
}

async function resolveTwitter(token: string): Promise<ResolvedChannel[]> {
    const { ok, status, data } = await getJson(
        "https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,username",
        { Authorization: `Bearer ${token}`, Accept: "application/json" }
    )
    if (!ok) throw { status }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u: any = (data as any)?.data
    if (!u) return []
    return [
        {
            id: u.id,
            name: u.name || u.username,
            avatarUrl: u.profile_image_url,
            detail: u.username ? `@${u.username}` : undefined,
        },
    ]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function resolveChannelsForToken(
    input: ResolveInput
): Promise<ResolveResult> {
    const { platform, accessToken, clientId } = input
    const base: ResolveResult = { platform, ok: true, channels: [] }
    try {
        let channels: ResolvedChannel[] = []
        switch (platform) {
            case "youtube":
                channels = await resolveYouTube(accessToken)
                break
            case "twitch":
                channels = await resolveTwitch(accessToken, clientId)
                break
            case "kick":
                channels = await resolveKick(accessToken)
                break
            case "facebook":
                channels = await resolveFacebook(accessToken)
                break
            case "instagram":
                channels = await resolveInstagram(accessToken)
                break
            case "linkedin":
                channels = await resolveLinkedIn(accessToken)
                break
            case "tiktok":
                channels = await resolveTikTok(accessToken)
                break
            case "twitter":
                channels = await resolveTwitter(accessToken)
                break
            default:
                return {
                    ...base,
                    ok: false,
                    error: "UNSUPPORTED_PLATFORM",
                    message: `Plataforma não suportada: ${platform}`,
                }
        }
        return { ...base, ok: true, channels }
    } catch (err) {
        // Thrown as { status } or { status, error, message }
        const e = err as { status?: number; error?: string; message?: string }
        const status = typeof e?.status === "number" ? e.status : 500
        const mapped = safeError(status)
        logger.warn("BYO token resolution failed", {
            platform,
            status,
        })
        return {
            ...base,
            ok: false,
            error: e?.error || mapped.error,
            message: e?.message || mapped.message,
        }
    }
}
