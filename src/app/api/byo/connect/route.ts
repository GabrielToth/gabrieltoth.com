/**
 * POST /api/byo/connect
 *
 * Connect a social media channel using user-supplied credentials / token (BYO).
 *
 * Allows authenticated users to connect their own channels when public OAuth app
 * review is unavailable, permissions are restricted by the platform (e.g. TikTok,
 * Facebook, Instagram), or the platform does not offer public OAuth (e.g. Kwai).
 *
 * Security:
 *  - Requires an authenticated site session (getServerSession).
 *  - Rejects extra fields (strict schema validation).
 *  - Rate limited per user/client IP.
 *  - User tokens are encrypted via AES-256 before storage in oauth_tokens.
 *  - Stores channel metadata into social_networks scoped strictly to user_id.
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { getAdminClient } from "@/lib/supabase/server"
import { getTokenStore } from "@/lib/token-store"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const logger = createLogger("ByoConnectEndpoint")

const SUPPORTED_PLATFORMS = [
    "youtube",
    "twitch",
    "kick",
    "facebook",
    "instagram",
    "linkedin",
    "tiktok",
    "twitter",
    "kwai",
] as const

const bodySchema = z
    .object({
        platform: z.enum(SUPPORTED_PLATFORMS),
        channelId: z
            .string()
            .min(1, "channelId is required")
            .max(256, "channelId too long"),
        channelName: z
            .string()
            .min(1, "channelName is required")
            .max(256, "channelName too long"),
        accessToken: z.string().max(8192).optional(),
        avatarUrl: z.string().max(2048).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .strict()

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "UNAUTHORIZED",
                    message: "Authentication required",
                },
                { status: 401 }
            )
        }
        const userId = session.user.id

        // Rate limiting
        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
        const rateLimit = await rateLimitByKey(
            buildClientKey({
                ip: clientIp,
                path: "/api/byo/connect",
                userAgent: request.headers.get("user-agent"),
            })
        )
        if (!rateLimit.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "RATE_LIMITED",
                    message: "Too many requests. Please try again later.",
                },
                { status: 429 }
            )
        }

        const raw = await request.json().catch(() => null)
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "INVALID_BODY",
                    message: "Invalid JSON body",
                },
                { status: 400 }
            )
        }

        const parsed = bodySchema.safeParse(raw)
        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: parsed.error.issues[0]?.message || "Invalid input",
                },
                { status: 400 }
            )
        }

        const {
            platform,
            channelId,
            channelName,
            accessToken,
            avatarUrl,
            metadata,
        } = parsed.data

        // 1. If accessToken is provided, securely encrypt & store in oauth_tokens
        if (accessToken && accessToken.trim().length > 0) {
            try {
                const tokenStore = getTokenStore()
                await tokenStore.storeToken({
                    userId,
                    platform,
                    accessToken: accessToken.trim(),
                })
            } catch (err) {
                logger.warn("Failed to store token for BYO channel", {
                    platform,
                    userId,
                    error: err instanceof Error ? err.message : String(err),
                })
            }
        }

        // 2. Upsert into social_networks
        const supabase = getAdminClient()
        const metaPayload: Record<string, unknown> = {
            byo: true,
            avatarUrl: avatarUrl || undefined,
            ...(metadata || {}),
        }

        const { data: channel, error: upsertError } = await supabase
            .from("social_networks")
            .upsert(
                {
                    user_id: userId,
                    platform,
                    platform_user_id: channelId.trim(),
                    platform_username: channelName.trim(),
                    status: "connected",
                    linked_at: new Date().toISOString(),
                    metadata: metaPayload,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id, platform, platform_user_id",
                }
            )
            .select()
            .single()

        if (upsertError) {
            logger.error("Failed to upsert social_networks record", {
                userId,
                platform,
                error: upsertError.message,
            })
            return NextResponse.json(
                {
                    success: false,
                    error: "DB_ERROR",
                    message: "Failed to connect channel",
                },
                { status: 500 }
            )
        }

        logger.info("BYO channel connected successfully", {
            userId,
            platform,
            channelId,
            channelName,
        })

        return NextResponse.json({
            success: true,
            channel: {
                id: channel?.id || `${platform}-${channelId}`,
                platform,
                accountId: channelId,
                accountName: channelName,
                isConnected: true,
                thumbnailUrl: avatarUrl,
                connectedAt: new Date().toISOString(),
            },
        })
    } catch (err) {
        logger.error("Unexpected error in BYO connect", {
            error: err instanceof Error ? err.message : String(err),
        })
        return NextResponse.json(
            {
                success: false,
                error: "INTERNAL_ERROR",
                message: "Internal server error",
            },
            { status: 500 }
        )
    }
}
