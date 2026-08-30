import type { DiscoverUser } from "@/lib/discover/types"

/**
 * Minimal sample discovery list containing the platform owner's own channels
 * ("ogabrieltoth") across all platforms.
 *
 * This JSON serves two purposes:
 * - A bundled example so anyone (including an AI agent or someone using a
 *   crawler) can see the exact schema and generate their own list without
 *   relying on our cloud.
 * - The default content shown in the Discover tab in local mode.
 *
 * Shape matches the `/api/discover` response payload.
 */

export function buildOgabrieltothSample(): DiscoverUser[] {
    return [
        {
            userId: "ogabrieltoth",
            username: "ogabrieltoth",
            displayName: "Gabriel Toth",
            avatarUrl: null,
            platforms: {
                youtube: {
                    username: "ogabrieltoth",
                    displayName: "Gabriel Toth",
                    profileImageUrl: null,
                    isLive: false,
                },
                twitch: {
                    username: "ogabrieltoth",
                    displayName: "ogabrieltoth",
                    profileImageUrl: null,
                    isLive: false,
                },
                kick: {
                    username: "ogabrieltoth",
                    displayName: "ogabrieltoth",
                    profileImageUrl: null,
                    isLive: false,
                },
                tiktok: {
                    username: "ogabrieltoth",
                    displayName: "ogabrieltoth",
                    profileImageUrl: null,
                    isLive: false,
                },
                instagram: {
                    username: "ogabrieltoth",
                    displayName: "ogabrieltoth",
                    profileImageUrl: null,
                    isLive: false,
                },
            },
        },
    ]
}

/**
 * The minimal JSON shown in the example / docs, as a plain object so it can be
 * pretty-printed and copied by users or AI agents.
 */
export const OGABRIELTOTH_SAMPLE_JSON: string = JSON.stringify(
    buildOgabrieltothSample(),
    null,
    2
)
