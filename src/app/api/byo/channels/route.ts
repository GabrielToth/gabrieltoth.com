/**
 * POST /api/byo/channels
 *
 * "Bring Your Own token" channel discovery for Local Mode.
 *
 * A signed-in user pastes an access token they obtained directly from the
 * platform (their own credentials) and receives the list of channels/accounts
 * that token can act on — for every supported social network. This enables the
 * local-execution flow without the site ever storing the token.
 *
 * Security:
 *  - Requires an authenticated site session (never an open token oracle).
 *  - Token is used in-memory for the single listing call and never logged.
 *  - Per-user rate limited to prevent enumeration/proxy abuse.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import {
    resolveChannelsForToken,
    type ByoPlatform,
} from "@/lib/byo/channel-resolver"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { createLogger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const logger = createLogger("ByoChannelsEndpoint")

const SUPPORTED: ByoPlatform[] = [
    "youtube",
    "twitch",
    "kick",
    "facebook",
    "instagram",
    "linkedin",
    "tiktok",
    "twitter",
]

const bodySchema = z.object({
    platform: z.string(),
    /** Access token OR API key supplied by the user (never persisted). */
    accessToken: z.string().min(8, "Token muito curto").max(4096),
    /** Optional Client-Id (Twitch requires it alongside the bearer token). */
    clientId: z.string().max(256).optional(),
    /** Optional: list several platforms at once. */
    platforms: z.array(z.string()).max(8).optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(request)
    if (!session?.user?.id) {
        return NextResponse.json(
            { success: false, error: "UNAUTHORIZED" },
            { status: 401 }
        )
    }

    // Per-user rate limit: listing channels via arbitrary tokens is sensitive.
    const rl = await rateLimitByKey(
        buildClientKey({
            ip: "token-resolver",
            path: "/api/byo/channels",
            userAgent: session.user.id,
        })
    )
    if (!rl.success) {
        return NextResponse.json(
            { success: false, error: "RATE_LIMITED" },
            { status: 429 }
        )
    }

    let parsed: z.infer<typeof bodySchema>
    try {
        parsed = bodySchema.parse(await request.json())
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                error: "INVALID_BODY",
                message: err instanceof Error ? err.message : "Invalid body",
            },
            { status: 400 }
        )
    }

    // Single platform or a batch. Normalize + validate against allowlist so a
    // caller cannot smuggle an unknown platform id.
    const requested = parsed.platforms?.length
        ? parsed.platforms
        : [parsed.platform]
    const platforms = requested
        .map(p => p.toLowerCase())
        .filter((p): p is ByoPlatform => SUPPORTED.includes(p as ByoPlatform))

    if (platforms.length === 0) {
        return NextResponse.json(
            {
                success: false,
                error: "UNSUPPORTED_PLATFORM",
                message: `Plataformas suportadas: ${SUPPORTED.join(", ")}`,
            },
            { status: 400 }
        )
    }

    const results = await Promise.all(
        platforms.map(platform =>
            resolveChannelsForToken({
                platform,
                accessToken: parsed.accessToken,
                clientId: parsed.clientId,
            })
        )
    )

    // Never echo the token back.
    logger.info("BYO channel listing", {
        userId: session.user.id,
        platforms,
        channelCounts: results.map(r => `${r.platform}:${r.channels.length}`),
    })

    return NextResponse.json({ success: true, results })
}
