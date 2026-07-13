/**
 * Tests for Kick Configuration Module
 * Covers createKickConfig(), validateKickConfig(), getKickConfig(), resetKickConfig()
 */

import {
    createKickConfig,
    getKickConfig,
    resetKickConfig,
    validateKickConfig,
} from "@/lib/kick/config"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

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

describe("Kick Config", () => {
    beforeEach(() => {
        setEnv({
            KICK_CLIENT_ID: "test-kick-client-id",
            KICK_CLIENT_SECRET: "test-kick-client-secret",
            KICK_REDIRECT_URI: "http://localhost:3000/callback/kick",
        })
    })

    afterEach(() => {
        resetKickConfig()
        unsetEnv(["KICK_CLIENT_ID", "KICK_CLIENT_SECRET", "KICK_REDIRECT_URI"])
    })

    describe("createKickConfig", () => {
        it("creates config with env vars", () => {
            const config = createKickConfig()

            expect(config.oauth.clientId).toBe("test-kick-client-id")
            expect(config.oauth.clientSecret).toBe("test-kick-client-secret")
            expect(config.oauth.redirectUri).toBe(
                "http://localhost:3000/callback/kick"
            )
        })

        it("uses default scopes", () => {
            const config = createKickConfig()

            expect(config.oauth.scopes).toContain("user:read")
            expect(config.oauth.scopes).toContain("channel:read")
            expect(config.oauth.scopes).toContain("chat:write")
        })

        it("uses default redirect URI when env var is missing", () => {
            unsetEnv(["KICK_REDIRECT_URI"])
            const config = createKickConfig()

            expect(config.oauth.redirectUri).toBe(
                "https://www.gabrieltoth.com/api/oauth/callback/kick"
            )
        })

        it("sets correct API URLs", () => {
            const config = createKickConfig()

            expect(config.apiBaseUrl).toBe("https://api.kick.com")
            expect(config.oauthAuthorizeUrl).toBe(
                "https://id.kick.com/oauth/authorize"
            )
            expect(config.oauthTokenUrl).toBe("https://id.kick.com/oauth/token")
            expect(config.websocketUrl).toBe("wss://ws.kick.com")
        })

        it("sets rate limit defaults", () => {
            const config = createKickConfig()

            expect(config.rateLimit.linkingAttemptsPerHour).toBe(5)
            expect(config.security.tokenExpiryBufferMs).toBe(5 * 60 * 1000)
        })
    })

    describe("validateKickConfig", () => {
        it("returns valid for complete config", () => {
            const config = createKickConfig()
            const result = validateKickConfig(config)

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it("returns error when client ID is missing", () => {
            const config = createKickConfig()
            config.oauth.clientId = ""
            const result = validateKickConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain("Kick Client ID is required")
        })

        it("returns error when client secret is missing", () => {
            const config = createKickConfig()
            config.oauth.clientSecret = ""
            const result = validateKickConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain("Kick Client Secret is required")
        })

        it("returns error when redirect URI is missing", () => {
            const config = createKickConfig()
            config.oauth.redirectUri = ""
            const result = validateKickConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain("Kick redirect URI is required")
        })

        it("returns error when linkingAttemptsPerHour is less than 1", () => {
            const config = createKickConfig()
            config.rateLimit.linkingAttemptsPerHour = 0
            const result = validateKickConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain(
                "Linking attempts per hour must be at least 1"
            )
        })

        it("collects multiple errors at once", () => {
            const config = createKickConfig()
            config.oauth.clientId = ""
            config.oauth.clientSecret = ""
            config.oauth.redirectUri = ""
            config.rateLimit.linkingAttemptsPerHour = 0
            const result = validateKickConfig(config)

            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThanOrEqual(4)
        })
    })

    describe("getKickConfig", () => {
        it("returns a config instance", () => {
            const config = getKickConfig()

            expect(config.oauth.clientId).toBe("test-kick-client-id")
        })

        it("returns the same instance on repeated calls (singleton)", () => {
            const config1 = getKickConfig()
            const config2 = getKickConfig()

            expect(config1).toBe(config2)
        })

        it("throws when env vars are missing", () => {
            unsetEnv(["KICK_CLIENT_ID", "KICK_CLIENT_SECRET"])
            resetKickConfig()

            expect(() => getKickConfig()).toThrow("Invalid Kick configuration")
        })
    })

    describe("resetKickConfig", () => {
        it("clears the cached config instance", () => {
            const config1 = getKickConfig()
            resetKickConfig()
            const config2 = getKickConfig()

            expect(config1).not.toBe(config2)
        })

        it("allows re-creation after reset", () => {
            resetKickConfig()
            const config = getKickConfig()

            expect(config.oauth.clientId).toBe("test-kick-client-id")
        })
    })
})
