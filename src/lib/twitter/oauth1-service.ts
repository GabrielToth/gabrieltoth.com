/**
 * Twitter/X OAuth 1.0a Service
 * 
 * OAuth 1.0a flow for X API v2 posting:
 * 1. POST /oauth/request_token → request token + secret
 * 2. Redirect to /oauth/authenticate?oauth_token=...
 * 3. Callback → oauth_token + oauth_verifier
 * 4. POST /oauth/access_token → access token + secret
 * 5. Sign API requests with OAuth 1.0a HMAC-SHA1
 * 
 * Why OAuth 1.0a instead of 2.0 PKCE?
 * The new X Developer Console (console.x.com) does not support
 * configuring OAuth 2.0 for newly created apps (feature flag
 * "enableAuthRedesignPhase2" is disabled). OAuth 1.0a is the
 * only working auth method for new Pay Per Use apps.
 */

import crypto from "crypto"
import { BaseService, ServiceError } from "../youtube/base-service"
import { TwitterConfig } from "./config"

export interface OAuth1RequestToken {
    oauthToken: string
    oauthTokenSecret: string
    oauthCallbackConfirmed: boolean
}

export interface OAuth1AccessToken {
    oauthToken: string
    oauthTokenSecret: string
    userId: string
    screenName: string
}

export interface TwitterUser {
    id: string
    name: string
    username: string
    profileImageUrl?: string
}

export class TwitterOAuth1Service extends BaseService {
    private readonly requestTokenUrl = "https://api.twitter.com/oauth/request_token"
    private readonly authorizeUrl = "https://api.twitter.com/oauth/authenticate"
    private readonly accessTokenUrl = "https://api.twitter.com/oauth/access_token"
    private readonly apiBase = "https://api.twitter.com/2"

    constructor(private config: TwitterConfig) {
        super()
    }

    /**
     * Generate OAuth 1.0a signature (HMAC-SHA1).
     */
    private generateSignature(
        method: string,
        baseUrl: string,
        params: Record<string, string>,
        consumerSecret: string,
        tokenSecret: string = ""
    ): string {
        // Collect all parameters and sort them
        const paramEntries = Object.entries(params)
            .map(([k, v]) => [this.percentEncode(k), this.percentEncode(v)])
            .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))

        const paramString = paramEntries.map(([k, v]) => `${k}=${v}`).join("&")

        const signatureBase = [
            method.toUpperCase(),
            this.percentEncode(baseUrl),
            this.percentEncode(paramString),
        ].join("&")

        const signingKey = `${this.percentEncode(consumerSecret)}&${this.percentEncode(tokenSecret)}`

        const hmac = crypto.createHmac("sha1", signingKey)
        hmac.update(signatureBase)
        return hmac.digest("base64")
    }

    private percentEncode(str: string): string {
        return encodeURIComponent(str)
            .replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    }

    /**
     * Generate OAuth 1.0a header for API requests.
     */
    private generateAuthHeader(
        method: string,
        url: string,
        consumerKey: string,
        consumerSecret: string,
        oauthToken: string = "",
        oauthTokenSecret: string = "",
        extraParams: Record<string, string> = {}
    ): string {
        const oauthParams: Record<string, string> = {
            oauth_consumer_key: consumerKey,
            oauth_nonce: crypto.randomBytes(16).toString("hex"),
            oauth_signature_method: "HMAC-SHA1",
            oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
            oauth_version: "1.0",
            ...extraParams,
        }

        if (oauthToken) {
            oauthParams.oauth_token = oauthToken
        }

        const allParams = { ...oauthParams, ...extraParams }

        // For signature, we need to parse URL params too
        const urlObj = new URL(url)
        const queryParams: Record<string, string> = {}
        urlObj.searchParams.forEach((v, k) => {
            queryParams[k] = v
        })

        const sigParams = { ...oauthParams, ...queryParams }

        const signature = this.generateSignature(
            method,
            urlObj.origin + urlObj.pathname,
            sigParams,
            consumerSecret,
            oauthTokenSecret
        )

        oauthParams.oauth_signature = signature

        const headerParts = Object.entries(oauthParams)
            .map(([k, v]) => `${this.percentEncode(k)}="${this.percentEncode(v)}"`)

        return `OAuth ${headerParts.join(", ")}`
    }

    /**
     * Step 1: Get request token.
     */
    async getRequestToken(): Promise<OAuth1RequestToken> {
        this.assertReady()

        const callbackUrl = this.config.oauth.redirectUri
        const consumerKey = this.config.oauth.clientId // Using clientId as consumerKey
        const consumerSecret = this.config.oauth.clientSecret // Using clientSecret as consumerSecret

        const authHeader = this.generateAuthHeader(
            "POST",
            this.requestTokenUrl,
            consumerKey,
            consumerSecret,
            "", // no token yet
            "",
            { oauth_callback: callbackUrl }
        )

        const response = await fetch(this.requestTokenUrl, {
            method: "POST",
            headers: {
                Authorization: authHeader,
            },
        })

        const text = await response.text()
        if (!response.ok) {
            throw new ServiceError(
                "REQUEST_TOKEN_FAILED",
                `Failed to get request token: ${text.slice(0, 500)}`,
                response.status
            )
        }

        const params = new URLSearchParams(text)

        return {
            oauthToken: params.get("oauth_token") || "",
            oauthTokenSecret: params.get("oauth_token_secret") || "",
            oauthCallbackConfirmed: params.get("oauth_callback_confirmed") === "true",
        }
    }

    /**
     * Step 2: Generate authorization URL.
     */
    generateAuthorizationUrl(requestToken: string): string {
        return `${this.authorizeUrl}?oauth_token=${requestToken}`
    }

    /**
     * Step 4: Exchange verifier for access token.
     */
    async getAccessToken(
        oauthToken: string,
        oauthVerifier: string,
        oauthTokenSecret: string
    ): Promise<OAuth1AccessToken> {
        this.assertReady()

        const consumerKey = this.config.oauth.clientId
        const consumerSecret = this.config.oauth.clientSecret

        const authHeader = this.generateAuthHeader(
            "POST",
            this.accessTokenUrl,
            consumerKey,
            consumerSecret,
            oauthToken,
            oauthTokenSecret,
            { oauth_verifier: oauthVerifier }
        )

        const response = await fetch(this.accessTokenUrl, {
            method: "POST",
            headers: {
                Authorization: authHeader,
            },
        })

        const text = await response.text()
        if (!response.ok) {
            throw new ServiceError(
                "ACCESS_TOKEN_FAILED",
                `Failed to get access token: ${text.slice(0, 500)}`,
                response.status
            )
        }

        const params = new URLSearchParams(text)

        return {
            oauthToken: params.get("oauth_token") || "",
            oauthTokenSecret: params.get("oauth_token_secret") || "",
            userId: params.get("user_id") || "",
            screenName: params.get("screen_name") || "",
        }
    }

    /**
     * Make an authenticated API request to X API v2.
     */
    async apiRequest<T>(
        method: string,
        path: string,
        oauthToken: string,
        oauthTokenSecret: string,
        body?: Record<string, unknown>
    ): Promise<T> {
        const url = `${this.apiBase}${path}`
        const consumerKey = this.config.oauth.clientId
        const consumerSecret = this.config.oauth.clientSecret

        const extraParams: Record<string, string> = {}
        const fetchOptions: RequestInit = {
            method,
            headers: {
                "Content-Type": "application/json",
            },
        }

        if (body && method !== "GET") {
            fetchOptions.body = JSON.stringify(body)
        }

        const authHeader = this.generateAuthHeader(
            method,
            url,
            consumerKey,
            consumerSecret,
            oauthToken,
            oauthTokenSecret,
            extraParams
        )

        fetchOptions.headers = {
            ...fetchOptions.headers as Record<string, string>,
            Authorization: authHeader,
        }

        const response = await fetch(url, fetchOptions)
        const text = await response.text()

        if (!response.ok) {
            let errorData: Record<string, unknown> = {}
            try {
                errorData = JSON.parse(text)
            } catch { /* ignore */ }
            throw new ServiceError(
                "API_REQUEST_FAILED",
                `X API request failed (${response.status}): ${text.slice(0, 500)}`,
                response.status,
                { error: errorData, path }
            )
        }

        try {
            return JSON.parse(text) as T
        } catch {
            throw new ServiceError(
                "INVALID_RESPONSE",
                `Invalid JSON from X API: ${text.slice(0, 500)}`,
                500
            )
        }
    }

    /**
     * Get authenticated user info.
     */
    async getUserInfo(
        oauthToken: string,
        oauthTokenSecret: string
    ): Promise<TwitterUser | null> {
        try {
            const data = await this.apiRequest<{ data: TwitterUser }>(
                "GET",
                "/users/me?user.fields=profile_image_url",
                oauthToken,
                oauthTokenSecret
            )
            return data.data
        } catch (err) {
            this.logger.error("Failed to get Twitter user info", {
                error: err instanceof Error ? err.message : String(err),
            })
            return null
        }
    }
}

let oauth1ServiceInstance: TwitterOAuth1Service | null = null

export function getTwitterOAuth1Service(config: TwitterConfig): TwitterOAuth1Service {
    if (!oauth1ServiceInstance) {
        oauth1ServiceInstance = new TwitterOAuth1Service(config)
    }
    return oauth1ServiceInstance
}

export function resetTwitterOAuth1Service(): void {
    oauth1ServiceInstance = null
}
