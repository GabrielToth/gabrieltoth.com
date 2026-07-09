import { BaseService, ServiceError } from "../youtube/base-service"
import { TikTokConfig } from "./config"

export interface OAuthTokenResponse {
    accessToken: string
    refreshToken: string
    expiresIn: number
    tokenType: string
}

export interface AuthorizationUrlResponse {
    authorizationUrl: string
    state: string
}

export interface TikTokUser {
    openId: string
    unionId?: string
    displayName: string
    avatarUrl?: string
    avatarUrl100?: string
    avatarLargeUrl?: string
    bioDescription?: string
    isVerified?: boolean
    username?: string
    followerCount?: number
    followingCount?: number
    likesCount?: number
    videoCount?: number
}

export interface TikTokVideo {
    id: string
    title?: string
    coverImageUrl?: string
    shareUrl?: string
    videoDescription?: string
    duration?: number
    height?: number
    width?: number
    likeCount?: number
    commentCount?: number
    shareCount?: number
    viewCount?: number
    createTime?: string
}

export interface CreatorInfo {
    privacyLevelOptions: string[]
    maxVideoPostDurationSec: number
}

export interface VideoInitResponse {
    uploadUrl: string
    publishId: string
    uploadMethod: string
}

export interface PublishStatusResponse {
    status: string
    postUrl?: string
    failReason?: string
}

export class TikTokOAuthService extends BaseService {
    private readonly apiBase = "https://open.tiktokapis.com/v2"
    private readonly authBase = "https://www.tiktok.com/v2/auth/authorize"

    constructor(private config: TikTokConfig) {
        super()
    }

    generateAuthorizationUrl(userId: string): AuthorizationUrlResponse {
        this.assertReady()

        const state = crypto.randomUUID()
        const params = new URLSearchParams({
            client_key: this.config.oauth.clientKey,
            redirect_uri: this.config.oauth.redirectUri,
            response_type: "code",
            scope: this.config.oauth.scopes.join(","),
            state,
        })

        const authorizationUrl = `${this.authBase}/?${params.toString()}`

        this.logger.info("TikTok authorization URL generated", { userId })

        return { authorizationUrl, state }
    }

    /**
     * Normalize TikTok token response to handle both flat and wrapped formats.
     *
     * TikTok sometimes wraps the token response in a `data` object (consistent with
     * their other API endpoints like getUserInfo which reads `data.data.user`):
     *   - Flat (per docs):  { access_token: "...", open_id: "...", ... }
     *   - Wrapped (observed): { data: { access_token: "...", open_id: "...", ... } }
     *
     * This helper checks both formats and throws if neither has access_token.
     */
    private normalizeTokenResponse(
        responseData: Record<string, unknown>,
        context: string
    ): {
        accessToken: string
        refreshToken: string
        expiresIn: number
        tokenType: string
        openId?: string
    } {
        // Try flat format first, fall back to wrapped data.data format
        const source = responseData.access_token
            ? responseData
            : (responseData.data as Record<string, unknown> | undefined) || {}

        if (!source.access_token) {
            this.logger.error(
                `TikTok token response missing access_token (${context})`,
                {
                    responseKeys: Object.keys(responseData),
                    hasDataWrapper: "data" in responseData,
                    rawPreview: JSON.stringify(responseData).substring(0, 500),
                }
            )
            throw new ServiceError(
                "TOKEN_PARSE_FAILED",
                `TikTok returned no access_token in response (${context})`,
                400,
                { responseData: JSON.stringify(responseData) }
            )
        }

        return {
            accessToken: source.access_token as string,
            refreshToken: (source.refresh_token as string) || "",
            expiresIn: (source.expires_in as number) || 86400,
            tokenType: (source.token_type as string) || "bearer",
            openId: source.open_id as string | undefined,
        }
    }

    async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
        this.assertReady()

        const params = new URLSearchParams({
            client_key: this.config.oauth.clientKey,
            client_secret: this.config.oauth.clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: this.config.oauth.redirectUri,
        })

        const response = await fetch(`${this.apiBase}/oauth/token/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cache-Control": "no-cache",
            },
            body: params.toString(),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new ServiceError(
                "TOKEN_EXCHANGE_FAILED",
                `Failed to exchange code for token: ${data.error_description || data.error || "Unknown"}`,
                400,
                { error: data }
            )
        }

        const normalized = this.normalizeTokenResponse(
            data,
            "exchangeCodeForToken"
        )

        this.logger.info("TikTok authorization code exchanged for token", {
            hasAccessToken: true,
            hasRefreshToken: !!normalized.refreshToken,
            expiresIn: normalized.expiresIn,
            hasOpenId: !!normalized.openId,
        })

        return {
            accessToken: normalized.accessToken,
            refreshToken: normalized.refreshToken,
            expiresIn: normalized.expiresIn,
            tokenType: normalized.tokenType,
        }
    }

    async refreshAccessToken(
        refreshToken: string
    ): Promise<OAuthTokenResponse> {
        this.assertReady()

        const params = new URLSearchParams({
            client_key: this.config.oauth.clientKey,
            client_secret: this.config.oauth.clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        })

        const response = await fetch(`${this.apiBase}/oauth/token/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cache-Control": "no-cache",
            },
            body: params.toString(),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new ServiceError(
                "TOKEN_REFRESH_FAILED",
                `Failed to refresh TikTok token: ${data.error_description || data.error || "Unknown"}`,
                400,
                { error: data }
            )
        }

        const normalized = this.normalizeTokenResponse(data, "refreshToken")

        this.logger.info("TikTok access token refreshed", {
            hasAccessToken: true,
            hasOpenId: !!normalized.openId,
        })

        return {
            accessToken: normalized.accessToken,
            refreshToken: normalized.refreshToken,
            expiresIn: normalized.expiresIn,
            tokenType: normalized.tokenType,
        }
    }

    async revokeToken(accessToken: string): Promise<boolean> {
        this.assertReady()

        const params = new URLSearchParams({
            client_key: this.config.oauth.clientKey,
            client_secret: this.config.oauth.clientSecret,
            token: accessToken,
        })

        const response = await fetch(`${this.apiBase}/oauth/revoke/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        })

        if (!response.ok) {
            this.logger.warn("TikTok token revocation failed", {
                status: response.status,
            })
            return false
        }

        this.logger.info("TikTok access token revoked")
        return true
    }

    async getUserInfo(accessToken: string): Promise<TikTokUser | null> {
        this.assertReady()

        if (!accessToken) {
            this.logger.error(
                "Cannot get TikTok user info: no access token provided"
            )
            return null
        }

        const fields = [
            "open_id",
            "union_id",
            "avatar_url",
            "avatar_url_100",
            "avatar_large_url",
            "display_name",
            "bio_description",
            "profile_deep_link",
            "is_verified",
            "username",
            "follower_count",
            "following_count",
            "likes_count",
            "video_count",
        ].join(",")

        const params = new URLSearchParams({ fields })

        const maxRetries = 3
        let lastError: unknown

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            if (attempt > 0) {
                const delay = Math.min(1000 * 2 ** attempt, 4000)
                await new Promise(resolve => setTimeout(resolve, delay))
            }

            try {
                const response = await fetch(
                    `${this.apiBase}/user/info/?${params.toString()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                )

                if (response.ok) {
                    const data = await response.json()

                    if (!data.data?.user) {
                        this.logger.warn("No TikTok user data returned")
                        return null
                    }

                    const user = data.data.user

                    return {
                        openId: user.open_id,
                        unionId: user.union_id,
                        displayName: user.display_name,
                        avatarUrl: user.avatar_url,
                        avatarUrl100: user.avatar_url_100,
                        avatarLargeUrl: user.avatar_large_url,
                        bioDescription: user.bio_description,
                        isVerified: user.is_verified,
                        username: user.username,
                        followerCount: user.follower_count,
                        followingCount: user.following_count,
                        likesCount: user.likes_count,
                        videoCount: user.video_count,
                    }
                }

                const errorBody = await response.json()
                lastError = errorBody
                this.logger.warn(
                    "Failed to get TikTok user info (will retry)",
                    {
                        attempt: attempt + 1,
                        status: response.status,
                        error:
                            errorBody.error?.message ||
                            errorBody.error_description ||
                            JSON.stringify(errorBody),
                    }
                )
            } catch (err) {
                lastError = err
                this.logger.warn(
                    "TikTok user info request failed (will retry)",
                    {
                        attempt: attempt + 1,
                        error: err instanceof Error ? err.message : String(err),
                    }
                )
            }
        }

        this.logger.error("Failed to get TikTok user info after retries", {
            error:
                lastError instanceof Error
                    ? lastError.message
                    : JSON.stringify(lastError),
        })
        return null
    }

    async getVideoList(
        accessToken: string,
        options?: {
            maxCount?: number
            cursor?: string
        }
    ): Promise<{ videos: TikTokVideo[]; cursor?: string; hasMore: boolean }> {
        this.assertReady()

        const fields = [
            "id",
            "title",
            "cover_image_url",
            "share_url",
            "video_description",
            "duration",
            "height",
            "width",
            "like_count",
            "comment_count",
            "share_count",
            "view_count",
            "create_time",
        ].join(",")

        const params = new URLSearchParams({ fields })

        if (options?.maxCount) params.set("max_count", String(options.maxCount))
        if (options?.cursor) params.set("cursor", options.cursor)

        const response = await fetch(
            `${this.apiBase}/video/list/?${params.toString()}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: "{}",
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new ServiceError(
                "VIDEO_LIST_FAILED",
                `Failed to get video list: ${error.error?.message || "Unknown"}`,
                400,
                { error }
            )
        }

        const data = await response.json()

        const videos: TikTokVideo[] = (data.data?.videos || []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (v: any) => ({
                id: v.id,
                title: v.title,
                coverImageUrl: v.cover_image_url,
                shareUrl: v.share_url,
                videoDescription: v.video_description,
                duration: v.duration,
                height: v.height,
                width: v.width,
                likeCount: v.like_count,
                commentCount: v.comment_count,
                shareCount: v.share_count,
                viewCount: v.view_count,
                createTime: v.create_time,
            })
        )

        return {
            videos,
            cursor: data.data?.cursor,
            hasMore: data.data?.has_more || false,
        }
    }

    async queryCreatorInfo(accessToken: string): Promise<CreatorInfo | null> {
        this.assertReady()

        const response = await fetch(
            `${this.apiBase}/post/publish/creator_info/query/`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: "{}",
            }
        )

        if (!response.ok) {
            const error = await response.json()
            this.logger.warn("Failed to query TikTok creator info", {
                error: error.error?.message,
            })
            return null
        }

        const data = await response.json()

        return {
            privacyLevelOptions: data.data?.privacy_level_options || [
                "SELF_ONLY",
            ],
            maxVideoPostDurationSec:
                data.data?.max_video_post_duration_sec || 180,
        }
    }

    async initVideoPublish(
        accessToken: string,
        options: {
            source: "FILE_UPLOAD" | "PULL_FROM_URL"
            videoUrl?: string
            title: string
            privacyLevel?: string
            disableDuet?: boolean
            disableStitch?: boolean
            disableComment?: boolean
            brandContentToggle?: boolean
            brandOrganicToggle?: boolean
        }
    ): Promise<VideoInitResponse> {
        this.assertReady()

        const body: Record<string, unknown> = {
            source: options.source,
            title: options.title,
            privacy_level: options.privacyLevel || "SELF_ONLY",
            disable_duet: options.disableDuet || false,
            disable_stitch: options.disableStitch || false,
            disable_comment: options.disableComment || false,
            brand_content_toggle: options.brandContentToggle || false,
            brand_organic_toggle: options.brandOrganicToggle || false,
        }

        if (options.source === "PULL_FROM_URL" && options.videoUrl) {
            body.video_url = options.videoUrl
        }

        if (options.source === "FILE_UPLOAD") {
            body.upload_method = "FILE_UPLOAD"
        }

        const response = await fetch(
            `${this.apiBase}/post/publish/video/init/`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        )

        const data = await response.json()

        if (!response.ok) {
            throw new ServiceError(
                "VIDEO_INIT_FAILED",
                `Failed to initialize video publish: ${data.error?.message || data.error_description || "Unknown"}`,
                400,
                { error: data }
            )
        }

        this.logger.info("TikTok video publish initialized", {
            publishId: data.data?.publish_id,
        })

        return {
            uploadUrl: data.data?.upload_url,
            publishId: data.data?.publish_id,
            uploadMethod: data.data?.upload_method || "FILE_UPLOAD",
        }
    }

    async uploadVideoFile(
        uploadUrl: string,
        videoBuffer: ArrayBuffer
    ): Promise<boolean> {
        this.assertReady()

        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "video/mp4",
                "Content-Length": String(videoBuffer.byteLength),
            },
            body: videoBuffer,
        })

        if (!response.ok) {
            this.logger.warn("TikTok video file upload failed", {
                status: response.status,
            })
            return false
        }

        this.logger.info("TikTok video file uploaded successfully")
        return true
    }

    async getPublishStatus(
        accessToken: string,
        publishId: string
    ): Promise<PublishStatusResponse> {
        this.assertReady()

        const response = await fetch(
            `${this.apiBase}/post/publish/status/fetch/`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ publish_id: publishId }),
            }
        )

        const data = await response.json()

        if (!response.ok) {
            throw new ServiceError(
                "PUBLISH_STATUS_FAILED",
                `Failed to fetch publish status: ${data.error?.message || "Unknown"}`,
                400,
                { error: data }
            )
        }

        return {
            status: data.data?.status || "UNKNOWN",
            postUrl: data.data?.share_url,
            failReason: data.data?.fail_reason,
        }
    }

    async initPhotoPost(
        accessToken: string,
        options: {
            title: string
            privacyLevel?: string
            mediaType: "JPG" | "WEBP"
            source: "FILE_UPLOAD" | "PULL_FROM_URL"
            imageUrl?: string
            disableComment?: boolean
        }
    ): Promise<VideoInitResponse> {
        this.assertReady()

        const body: Record<string, unknown> = {
            post_mode: "PHOTO",
            media_type: options.mediaType,
            source: options.source,
            title: options.title,
            privacy_level: options.privacyLevel || "SELF_ONLY",
            disable_comment: options.disableComment || false,
        }

        if (options.source === "PULL_FROM_URL" && options.imageUrl) {
            body.photo_url = options.imageUrl
        }

        const response = await fetch(
            `${this.apiBase}/post/publish/content/init/`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        )

        const data = await response.json()

        if (!response.ok) {
            throw new ServiceError(
                "PHOTO_INIT_FAILED",
                `Failed to initialize photo post: ${data.error?.message || "Unknown"}`,
                400,
                { error: data }
            )
        }

        this.logger.info("TikTok photo post initialized", {
            publishId: data.data?.publish_id,
        })

        return {
            uploadUrl: data.data?.upload_url,
            publishId: data.data?.publish_id,
            uploadMethod: data.data?.upload_method || "FILE_UPLOAD",
        }
    }
}

let oauthServiceInstance: TikTokOAuthService | null = null

export function getTikTokOAuthService(
    config: TikTokConfig
): TikTokOAuthService {
    if (!oauthServiceInstance) {
        oauthServiceInstance = new TikTokOAuthService(config)
    }
    return oauthServiceInstance
}

export function resetTikTokOAuthService(): void {
    oauthServiceInstance = null
}
