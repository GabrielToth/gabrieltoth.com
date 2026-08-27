/**
 * Channels API Service
 * Handles fetching and managing social channel connections
 * Includes caching and error handling
 */

import { SocialChannel } from "@/components/publish"

// Cache storage
const cache = new Map<string, { data: SocialChannel[]; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

/**
 * Fetch available social channels
 * Implements caching to reduce API calls
 */
export async function fetchChannels(): Promise<SocialChannel[]> {
    const cacheKey = "channels"
    const now = Date.now()

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data
    }

    try {
        // Fetch the user's real connected social networks from the backend.
        const response = await fetch("/api/user/channels", {
            headers: { Accept: "application/json" },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch channels: HTTP ${response.status}`)
        }

        const json = await response.json()
        const items: Array<{
            id?: string
            platform?: string
            accountId?: string
            accountName?: string
            isConnected?: boolean
            connectedAt?: string
        }> = Array.isArray(json?.channels) ? json.channels : []

        const data: SocialChannel[] = items
            .filter(item => item && item.platform)
            .map(item => ({
                id:
                    item.id ||
                    `${item.platform}-${item.accountId || Date.now()}`,
                platform: item.platform as SocialChannel["platform"],
                accountId: item.accountId || item.id || "",
                accountName: item.accountName || item.platform || "",
                isConnected: item.isConnected ?? true,
                connectedAt: item.connectedAt
                    ? new Date(item.connectedAt)
                    : undefined,
            }))

        // Cache the result
        cache.set(cacheKey, { data, timestamp: now })

        return data
    } catch (error) {
        console.error("Failed to fetch channels:", error)
        // Return empty list so callers can show the "no channels" empty state.
        return []
    }
}

/**
 * Connect a social channel
 */
export async function connectChannel(platform: string): Promise<SocialChannel> {
    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/channels/connect', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ platform })
        // })
        // const data = await response.json()

        const channels = await fetchChannels()
        const channel = channels.find(c => c.platform === platform)

        if (!channel) {
            throw new Error("Channel not found")
        }

        const connectedChannel: SocialChannel = {
            ...channel,
            isConnected: true,
            connectedAt: new Date(),
        }

        // Invalidate cache
        cache.delete("channels")

        return connectedChannel
    } catch (error) {
        console.error("Failed to connect channel:", error)
        throw new Error("Failed to connect channel")
    }
}

/**
 * Disconnect a social channel
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function disconnectChannel(platform: string): Promise<void> {
    try {
        // In production, replace with actual API call
        // const response = await fetch(`/api/channels/${platform}/disconnect`, {
        //   method: 'POST'
        // })

        // Invalidate cache
        cache.delete("channels")
    } catch (error) {
        console.error("Failed to disconnect channel:", error)
        throw new Error("Failed to disconnect channel")
    }
}

/**
 * Clear cache
 */
export function clearChannelsCache(): void {
    cache.delete("channels")
}
