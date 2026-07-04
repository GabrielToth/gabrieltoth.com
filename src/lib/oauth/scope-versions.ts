/**
 * Scope Version Tracking
 *
 * Each time OAuth scopes change for a platform, increment the version.
 * This allows the frontend to detect when a user needs to reconnect
 * their account to grant new permissions.
 *
 * Usage:
 *   1. When connecting a channel, store CURRENT_SCOPE_VERSIONS[platform]
 *      in social_networks.metadata.scopeVersion
 *   2. When displaying channels, compare stored version vs current version
 *   3. If stored < current, show "reconnect needed" warning
 */

export const CURRENT_SCOPE_VERSIONS: Record<string, number> = {
    youtube: 2, // v2 = added yt-analytics scopes (monetary, members, affiliates)
    facebook: 1, // v1 = initial pages_manage_posts, pages_read_engagement
    instagram: 1, // v1 = initial instagram_basic, instagram_content_publish
    tiktok: 1, // v1 = initial video.publish, user.info.basic
    kick: 1, // v1 = initial user:read, channel:read, chat:write
    twitter: 1, // v1 = initial tweet.write, tweet.read
    linkedin: 1, // v1 = initial w_member_social
}

/**
 * Get the current scope version for a platform.
 * Defaults to 0 if platform is unknown (triggers reconnect).
 */
export function getScopeVersion(platform: string): number {
    return CURRENT_SCOPE_VERSIONS[platform] ?? 0
}

/**
 * Check if a stored scope version is outdated compared to the current version.
 * Returns true when the channel needs to be reconnected to get new permissions.
 */
export function isScopeOutdated(
    storedVersion: number | undefined | null,
    platform: string
): boolean {
    const current = getScopeVersion(platform)
    if (current === 0) return false // unknown platform, don't nag
    return (storedVersion ?? 0) < current
}
