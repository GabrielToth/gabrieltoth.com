import type { SocialPlatform } from "@/lib/networks/network-manager"
import type { OAuthPlatform } from "@/lib/oauth/oauth-types"

const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
    "youtube",
    "facebook",
    "instagram",
    "twitter",
    "linkedin",
    "tiktok",
    "twitch",
    "kick",
]

const OAUTH_PLATFORMS: readonly OAuthPlatform[] = [
    "youtube",
    "facebook",
    "instagram",
    "twitter",
    "linkedin",
    "tiktok",
    "twitch",
    "kick",
]

export function isSocialPlatform(value: unknown): value is SocialPlatform {
    return (
        typeof value === "string" &&
        (SOCIAL_PLATFORMS as readonly string[]).includes(value)
    )
}

export function isOAuthPlatform(value: unknown): value is OAuthPlatform {
    return (
        typeof value === "string" &&
        (OAUTH_PLATFORMS as readonly string[]).includes(value)
    )
}

export function asSocialPlatform(value: string): SocialPlatform {
    return value as SocialPlatform
}

export function asOAuthPlatform(value: string): OAuthPlatform {
    return value as OAuthPlatform
}

export const SOCIAL_PLATFORM_LIST: readonly SocialPlatform[] = SOCIAL_PLATFORMS
export const OAUTH_PLATFORM_LIST: readonly OAuthPlatform[] = OAUTH_PLATFORMS
