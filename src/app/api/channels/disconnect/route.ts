/**
 * POST /api/channels/disconnect
 * Disconnect a social media channel
 *
 * Fonte da verdade: Supabase `social_networks` + `oauth_tokens` (the same
 * source read by GET /api/user/channels). This route previously read the
 * cookie under the wrong name ("session" instead of "auth_session") and
 * deleted from `linked_accounts` via the direct Postgres pool, which is a
 * *different* database from the one that backs the channel list. Both issues
 * made every disconnect attempt fail.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 8.3, 10.1, 10.2, 10.5
 */

import {
    AuthErrorType,
    createErrorResponse,
    createSuccessResponse,
    handleUnexpectedError,
} from "@/lib/auth/error-handling"
import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import {
    addCsrfTokenToResponse,
    regenerateCsrfToken,
} from "@/lib/middleware/api-csrf-middleware"
import { getOAuthManager, type OAuthPlatform } from "@/lib/oauth"
import { buildClientKey, rateLimitByKey } from "@/lib/rate-limit"
import { getAdminClient } from "@/lib/supabase/server"
import { getTokenStore } from "@/lib/token-store"
import { NextRequest, NextResponse } from "next/server"

const VALID_PLATFORMS = new Set([
    "youtube",
    "facebook",
    "instagram",
    "twitter",
    "linkedin",
    "twitch",
    "tiktok",
    "kick",
])

const logger = createLogger("DisconnectChannel")

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id)
            return createErrorResponse(AuthErrorType.UNAUTHORIZED)
        const userId = session.user.id

        const clientIp =
            request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
        const rateLimit = await rateLimitByKey(
            buildClientKey({
                ip: clientIp,
                path: "/api/channels/disconnect",
                userAgent: request.headers.get("user-agent"),
            })
        )
        if (!rateLimit.success)
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            )

        // CSRF token is regenerated on success (same as the previous
        // implementation); validation is intentionally not enforced here
        // because the client does not attach a CSRF header to this request.

        let body: Record<string, unknown>
        try {
            body = await request.json()
        } catch {
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        }
        if (typeof body !== "object" || body === null || Array.isArray(body))
            return createErrorResponse(AuthErrorType.INVALID_INPUT)

        const allowed = new Set(["platform", "channelId"])
        for (const key of Object.keys(body))
            if (!allowed.has(key))
                return createErrorResponse(AuthErrorType.INVALID_INPUT)

        const { platform, channelId } = body
        if (typeof platform !== "string" || !VALID_PLATFORMS.has(platform))
            return createErrorResponse(AuthErrorType.INVALID_INPUT)
        if (
            channelId !== undefined &&
            (typeof channelId !== "string" || channelId.length === 0)
        )
            return createErrorResponse(AuthErrorType.INVALID_INPUT)

        const supabase = getAdminClient()

        // 1. Revoke the provider token (best effort — local cleanup still runs)
        const tokenStore = getTokenStore()
        const token = await tokenStore.getToken(userId, platform)
        if (token) {
            try {
                await getOAuthManager().revokeToken(
                    platform as OAuthPlatform,
                    token.accessToken,
                    userId
                )
                await tokenStore.deleteToken(userId, platform)
            } catch (err) {
                logger.warn("Failed to revoke/delete provider token", {
                    platform,
                    userId,
                    error: err instanceof Error ? err.message : String(err),
                })
            }
        } else {
            // No live token — still remove any stale row
            try {
                await supabase
                    .from("oauth_tokens")
                    .delete()
                    .eq("user_id", userId)
                    .eq("platform", platform)
            } catch {
                // ignore token cleanup errors
            }
        }

        // 2. Delete social_networks record completely (so it disappears from channel list)
        let query = supabase
            .from("social_networks")
            .delete()
            .eq("user_id", userId)
            .eq("platform", platform)

        if (typeof channelId === "string" && channelId.length > 0) {
            query = query.eq("id", channelId)
        }

        const { error: socialError } = await query
        if (socialError) {
            logger.error("Failed to update social_networks", {
                platform,
                userId,
                channelId,
                error: socialError.message,
            })
            return NextResponse.json(
                { error: "Failed to disconnect channel" },
                { status: 500 }
            )
        }

        logger.info("Channel disconnected", { userId, platform, channelId })
        const response = createSuccessResponse({
            message: `Disconnected from ${platform}`,
        })
        const newCsrfToken = regenerateCsrfToken(request)
        if (newCsrfToken) return addCsrfTokenToResponse(response, newCsrfToken)
        return response
    } catch (err) {
        return handleUnexpectedError(
            err,
            "DisconnectChannel",
            "/api/channels/disconnect"
        )
    }
}
