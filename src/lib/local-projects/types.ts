/**
 * Local Execution Mode - Project & Quota Architecture (N:N Multi-Project Engine)
 *
 * ZERO-BACKEND GUARANTEE:
 * All interfaces, stores, tokens, and quota tracking defined here operate
 * EXCLUSIVELY in client-side storage (localStorage / IndexedDB).
 * No keys, secrets, or tokens are ever forwarded to pentester-01, Vercel, or Supabase.
 */

export type PlatformType =
    | "youtube"
    | "meta"
    | "twitch"
    | "kick"
    | "tiktok"
    | "twitter"
    | "linkedin"
    | "kwai"

export type QuotaBucketType =
    | "daily_units" // E.g., YouTube 10,000 units/day
    | "read_requests" // Read QPS / rate limits
    | "write_requests" // Uploads, posts, comments
    | "chat_polling" // Live chat read interval

export interface QuotaLimitConfig {
    maxLimit: number
    periodMs: number
    resetTime: number
    currentUsage: number
}

export interface LocalProject {
    id: string
    name: string
    platform: PlatformType
    clientId?: string
    clientSecret?: string
    apiKey?: string
    // Granular multi-dimensional quota limits for this specific project
    quotas: Record<QuotaBucketType, QuotaLimitConfig>
    status: "active" | "exhausted" | "rate_limited" | "invalid_keys"
    retryAfter?: number
    createdAt: number
    updatedAt: number
}

export interface LocalChannelProjectBinding {
    channelId: string
    channelName: string
    platform: PlatformType
    avatarUrl?: string
    // N:N Relationship: A channel can be authorized under multiple projects (primary + fallbacks)
    projectIds: string[]
    // Per-project local credentials and OAuth tokens
    auths: {
        projectId: string
        accessToken?: string
        refreshToken?: string
        tokenExpiresAt?: number
    }[]
    createdAt: number
    updatedAt: number
}

export interface LocalExecutionConfig {
    version: 1
    projects: LocalProject[]
    channels: LocalChannelProjectBinding[]
}
