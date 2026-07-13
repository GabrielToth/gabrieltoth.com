/**
 * Tests for Twitch Configuration Module
 * Covers createTwitchConfig(), validateTwitchConfig(), getTwitchConfig(), resetTwitchConfig()
 */

import {
    createTwitchConfig,
    getTwitchConfig,
    resetTwitchConfig,
    validateTwitchConfig,
} from "@/lib/twitch/config"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

function setEnv(vars: Record<string, string>): void {
    for (const [key, val] of Object.entries(vars)) {
        process.env[key] = val
    }
}

function unsetEnv(keys: string[]): void {
    for (const key of keys) {
        delete process.env[key]
    }
}

describe("Twitch Config", () => {
    beforeEach(() => {
        setEnv({
            TWITCH_CLIENT_ID: "test-client-id",
            TWITCH_CLIENT_SECRET: "test-client-secret",
            TWITCH_REDIRECT_URI: "http://localhost:3000/callback/twitch",
        })
    })

    afterEach(() => {
        resetTwitchConfig()
        unsetEnv([
            "TWITCH_CLIENT_ID",
            "TWITCH_CLIENT_SECRET",
            "TWITCH_REDIRECT_URI",
        ])
    })

    describe("createTwitchConfig", () => {
        it("creates config with env vars", () => {
            const config = createTwitchConfig()

            expect(config.oauth.clientId).toBe("test-client-id")
            expect(config.oauth.clientSecret).toBe("test-client-secret")
            expect(config.oauth.redirectUri).toBe(
                "http://localhost:3000/callback/twitch"
            )
        })

        it("uses default scopes", () => {
            const config = createTwitchConfig()

            expect(config.oauth.scopes).toContain("chat:read")
            expect(config.oauth.scopes).toContain("chat:edit")
            expect(config.oauth.scopes).toContain("channel:manage:broadcast")
        })

        it("uses default redirect URI when env var is missing", () => {
            unsetEnv(["TWITCH_REDIRECT_URI"])
            const config = createTwitchConfig()

            expect(config.oauth.redirectUri).toBe(
                "http://localhost:3000/api/oauth/callback/twitch"
            )
        })

        it("sets correct API URLs", () => {
            const config = createTwitchConfig()

            expect(config.apiBaseUrl).toBe("https://api.twitch.tv/helix")
            expect(config.oauthAuthorizeUrl).toBe(
                "https://id.twitch.tv/oauth2/authorize"
            )
            expect(config.oauthTokenUrl).toBe(
                "https://id.twitch.tv/oauth2/token"
            )
            expect(config.oauthRevokeUrl).toBe(
                "https://id.twitch.tv/oauth2/revoke"
            )
        })

        it("sets IRC and EventSub URLs", () => {
            const config = createTwitchConfig()

            expect(config.ircUrl).toBe("irc.chat.twitch.tv")
            expect(config.ircPort).toBe(6667)
            expect(config.eventsubWsUrl).toBe("wss://eventsub.wss.twitch.tv")
        })

        it("sets rate limit and security defaults", () => {
            const config = createTwitchConfig()

            expect(config.rateLimit.requestsPerMinute).toBe(800)
            expect(config.security.tokenExpiryBufferMs).toBe(5 * 60 * 1000)
        })
    })

    describe("validateTwitchConfig", () => {
        it("returns valid for complete config", () => {
            const config = createTwitchConfig()
            const result = validateTwitchConfig(config)

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it("returns error when client ID is missing", () => {
            const config = createTwitchConfig()
            config.oauth.clientId = ""
            const result = validateTwitchConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain("Twitch Client ID is required")
        })

        it("returns error when client secret is missing", () => {
            const config = createTwitchConfig()
            config.oauth.clientSecret = ""
            const result = validateTwitchConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain("Twitch Client Secret is required")
        })

        it("returns error when redirect URI is missing", () => {
            const config = createTwitchConfig()
            config.oauth.redirectUri = ""
            const result = validateTwitchConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain("Twitch redirect URI is required")
        })

        it("collects multiple errors at once", () => {
            const config = createTwitchConfig()
            config.oauth.clientId = ""
            config.oauth.clientSecret = ""
            config.oauth.redirectUri = ""
            const result = validateTwitchConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toHaveLength(3)
        })
    })

    describe("getTwitchConfig", () => {
        it("returns a config instance", () => {
            const config = getTwitchConfig()

            expect(config.oauth.clientId).toBe("test-client-id")
        })

        it("returns the same instance on repeated calls (singleton)", () => {
            const config1 = getTwitchConfig()
            const config2 = getTwitchConfig()

            expect(config1).toBe(config2)
        })

        it("throws when env vars are missing", () => {
            unsetEnv(["TWITCH_CLIENT_ID", "TWITCH_CLIENT_SECRET"])
            resetTwitchConfig()

            expect(() => getTwitchConfig()).toThrow(
                "Invalid Twitch configuration"
            )
        })
    })

    describe("resetTwitchConfig", () => {
        it("clears the cached config instance", () => {
            const config1 = getTwitchConfig()
            resetTwitchConfig()
            const config2 = getTwitchConfig()

            expect(config1).not.toBe(config2)
        })

        it("allows re-creation after reset", () => {
            resetTwitchConfig()
            const config = getTwitchConfig()

            expect(config.oauth.clientId).toBe("test-client-id")
        })
    })
})
