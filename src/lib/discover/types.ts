export interface DiscoverPlatform {
    platform?: string
    username: string
    displayName: string
    profileImageUrl: string | null
    isLive: boolean
}

export interface DiscoverUser {
    userId: string
    username: string
    displayName: string
    avatarUrl: string | null
    /** map of platform key -> platform info */
    platforms: Record<string, DiscoverPlatform>
}
