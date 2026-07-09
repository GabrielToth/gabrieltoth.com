import { createLogger } from "@/lib/logger"
import { getTikTokConfig } from "@/lib/tiktok/config"
import { getTikTokOAuthService } from "@/lib/tiktok/oauth-service"
import { getTokenStore } from "@/lib/token-store"
import { getScopeVersion } from "@/lib/oauth/scope-versions"
import { verifyState } from "@/lib/oauth/state-signer"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("TikTokCallbackEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const oauthError = searchParams.get("error")

        if (oauthError) {
            logger.warn("TikTok OAuth error from TikTok", {
                error: oauthError,
            })
            return NextResponse.redirect(
                new URL(
                    `/dashboard?tiktok=error&reason=${oauthError}`,
                    request.url
                )
            )
        }

        if (!code) {
            logger.warn("Missing authorization code in TikTok callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?tiktok=error&reason=missing_params",
                    request.url
                )
            )
        }

        if (!state) {
            logger.warn("Missing state parameter in TikTok callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?tiktok=error&reason=missing_params",
                    request.url
                )
            )
        }

        const config = getTikTokConfig()
        const oauthService = getTikTokOAuthService(config)
        await oauthService.initialize()

        const verification = verifyState(state)

        if (!verification.valid || !verification.payload) {
            logger.warn("Invalid or expired TikTok state parameter", {
                error: verification.error,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?tiktok=error&reason=invalid_state",
                    request.url
                )
            )
        }

        const userId = verification.payload.userId

        if (verification.payload.platform !== "tiktok") {
            logger.warn(
                "TikTok callback received state for different platform",
                { platform: verification.payload.platform }
            )
            return NextResponse.redirect(
                new URL(
                    "/dashboard?tiktok=error&reason=invalid_state",
                    request.url
                )
            )
        }

        logger.info("TikTok state parameter validated via HMAC", { userId })

        const tokenResponse = await oauthService.exchangeCodeForToken(code)

        logger.info("TikTok authorization code exchanged successfully", {
            userId,
            hasAccessToken: !!tokenResponse.accessToken,
        })

        const tiktokUser = await oauthService.getUserInfo(
            tokenResponse.accessToken
        )

        if (!tiktokUser) {
            logger.warn("Failed to retrieve TikTok user info", { userId })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?tiktok=error&reason=user_info_failed",
                    request.url
                )
            )
        }

        logger.info("TikTok user retrieved", {
            userId,
            openId: tiktokUser.openId,
            displayName: tiktokUser.displayName,
        })

        const expiresAt = tokenResponse.expiresIn
            ? Date.now() + tokenResponse.expiresIn * 1000
            : undefined

        const tokenStore = getTokenStore()
        await tokenStore.storeToken({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt,
            platform: "tiktok",
            userId,
        })

        logger.info("TikTok user token stored successfully", { userId })

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error: socialError } = await supabase
            .from("social_networks")
            .upsert(
                {
                    user_id: userId,
                    platform: "tiktok",
                    platform_user_id: tiktokUser.openId,
                    platform_username: tiktokUser.displayName,
                    status: "connected",
                    linked_at: new Date().toISOString(),
                    metadata: {
                        openId: tiktokUser.openId,
                        unionId: tiktokUser.unionId,
                        username: tiktokUser.username,
                        avatarUrl: tiktokUser.avatarUrl,
                        followerCount: tiktokUser.followerCount,
                        followingCount: tiktokUser.followingCount,
                        videoCount: tiktokUser.videoCount,
                        isVerified: tiktokUser.isVerified,
                        scopeVersion: getScopeVersion("tiktok"),
                    },
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id, platform, platform_user_id",
                }
            )

        if (socialError) {
            logger.error("Failed to upsert TikTok social_networks record", {
                userId,
                error: socialError.message,
            })
        }

        logger.info("TikTok account linked successfully", {
            userId,
            openId: tiktokUser.openId,
        })

        return NextResponse.redirect(
            new URL("/dashboard?tiktok=success", request.url)
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to complete TikTok linking", {
            error: err.message,
            stack: err.stack?.slice(0, 500),
        })

        const errorMsg = encodeURIComponent(err.message.slice(0, 100))

        return NextResponse.redirect(
            new URL(
                `/dashboard?tiktok=error&reason=${errorMsg}`,
                request.url
            )
        )
    }
}
