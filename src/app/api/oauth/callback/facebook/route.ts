import { createLogger } from "@/lib/logger"
import { getFacebookConfig } from "@/lib/facebook/config"
import { getFacebookOAuthService } from "@/lib/facebook/oauth-service"
import { getTokenStore } from "@/lib/token-store"
import { verifyState } from "@/lib/oauth/state-signer"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("FacebookCallbackEndpoint")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const oauthError = searchParams.get("error")

        if (oauthError) {
            logger.warn("Facebook OAuth error from Facebook", {
                error: oauthError,
            })
            return NextResponse.redirect(
                new URL(
                    `/dashboard?facebook=error&reason=${oauthError}`,
                    request.url,
                ),
            )
        }

        if (!code) {
            logger.warn("Missing authorization code in Facebook callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?facebook=error&reason=missing_params",
                    request.url,
                ),
            )
        }

        if (!state) {
            logger.warn("Missing state parameter in Facebook callback")
            return NextResponse.redirect(
                new URL(
                    "/dashboard?facebook=error&reason=missing_params",
                    request.url,
                ),
            )
        }

        const config = getFacebookConfig()
        const oauthService = getFacebookOAuthService(config)
        await oauthService.initialize()

        const verification = verifyState(state)

        if (!verification.valid || !verification.payload) {
            logger.warn("Invalid or expired Facebook state parameter", {
                error: verification.error,
            })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?facebook=error&reason=invalid_state",
                    request.url,
                ),
            )
        }

        const userId = verification.payload.userId

        if (verification.payload.platform !== "facebook") {
            logger.warn(
                "Facebook callback received state for different platform",
                { platform: verification.payload.platform },
            )
            return NextResponse.redirect(
                new URL(
                    "/dashboard?facebook=error&reason=invalid_state",
                    request.url,
                ),
            )
        }

        logger.info("Facebook state parameter validated via HMAC", { userId })

        const tokenResponse = await oauthService.exchangeCodeForToken(code)

        logger.info("Facebook authorization code exchanged successfully", {
            userId,
        })

        const facebookUser = await oauthService.getCurrentUser(
            tokenResponse.accessToken,
        )

        if (!facebookUser) {
            logger.warn("Failed to retrieve Facebook user info", { userId })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?facebook=error&reason=user_info_failed",
                    request.url,
                ),
            )
        }

        logger.info("Facebook user retrieved", {
            userId,
            fbUserId: facebookUser.id,
            name: facebookUser.name,
        })

        const pages = await oauthService.getUserPages(
            tokenResponse.accessToken,
        )

        if (pages.length === 0) {
            logger.warn("No Facebook Pages found for user", { userId })
            return NextResponse.redirect(
                new URL(
                    "/dashboard?facebook=error&reason=no_pages",
                    request.url,
                ),
            )
        }

        logger.info("Facebook Pages retrieved", {
            userId,
            pageCount: pages.length,
        })

        const expiresAt = tokenResponse.expiresIn
            ? Date.now() + tokenResponse.expiresIn * 1000
            : undefined

        const tokenStore = getTokenStore()
        await tokenStore.storeToken({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            expiresAt,
            platform: "facebook",
            userId,
        })

        logger.info("Facebook user token stored successfully", { userId })

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        )

        for (const page of pages) {
            const { error: socialError } = await supabase
                .from("social_networks")
                .upsert(
                    {
                        user_id: userId,
                        platform: "facebook",
                        platform_user_id: page.id,
                        platform_username: page.name,
                        status: "connected",
                        linked_at: new Date().toISOString(),
                        metadata: {
                            pageId: page.id,
                            pageName: page.name,
                            category: page.category,
                            tasks: page.tasks,
                            pictureUrl: page.pictureUrl,
                            followerCount: page.followerCount,
                            fbUserId: facebookUser.id,
                            fbUserName: facebookUser.name,
                        },
                        updated_at: new Date().toISOString(),
                    },
                    {
                        onConflict: "user_id, platform, platform_user_id",
                    },
                )

            if (socialError) {
                logger.error(
                    "Failed to upsert Facebook social_networks record",
                    {
                        userId,
                        pageId: page.id,
                        error: socialError.message,
                    },
                )
            }
        }

        logger.info("Facebook account linked successfully", {
            userId,
            fbUserId: facebookUser.id,
            pageCount: pages.length,
        })

        return NextResponse.redirect(
            new URL("/dashboard?facebook=success", request.url),
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to complete Facebook linking", err)

        return NextResponse.redirect(
            new URL(
                "/dashboard?facebook=error&reason=server_error",
                request.url,
            ),
        )
    }
}
