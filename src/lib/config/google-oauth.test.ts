/**
 * Google OAuth Configuration Tests
 * Validates: Requirements 5.1-5.3, 26.1-26.3
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
    getGoogleOAuthAuthorizationUrl,
    getGoogleOAuthConfig,
    getGoogleOAuthScopes,
    getGoogleOAuthTokenEndpoint,
    getGoogleOAuthUserInfoEndpoint,
    isGoogleOAuthConfigured,
    validateGoogleOAuthRedirectUri,
} from "./google-oauth"

describe("Google OAuth Configuration", () => {
    const originalEnv = process.env

    beforeEach(() => {
        // Set up valid environment variables
        process.env.GOOGLE_CLIENT_ID = "test-client-id"
        process.env.GOOGLE_CLIENT_SECRET = "test-client-secret"
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id"
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI =
            "http://localhost:3000/api/auth/google/callback"
    })

    afterEach(() => {
        process.env = originalEnv
    })

    describe("getGoogleOAuthConfig", () => {
        it("returns valid configuration when all environment variables are set", () => {
            const config = getGoogleOAuthConfig()

            expect(config.clientId).toBe("test-client-id")
            expect(config.clientSecret).toBe("test-client-secret")
            expect(config.publicClientId).toBe("test-client-id")
            expect(config.redirectUri).toBe(
                "http://localhost:3000/api/auth/google/callback"
            )
            expect(config.scopes).toEqual(["email", "profile"])
            expect(config.isConfigured).toBe(true)
        })

        it("throws error when GOOGLE_CLIENT_ID is missing", () => {
            delete process.env.GOOGLE_CLIENT_ID

            expect(() => getGoogleOAuthConfig()).toThrow(
                "GOOGLE_CLIENT_ID environment variable is missing"
            )
        })

        it("throws error when GOOGLE_CLIENT_SECRET is missing", () => {
            delete process.env.GOOGLE_CLIENT_SECRET

            expect(() => getGoogleOAuthConfig()).toThrow(
                "GOOGLE_CLIENT_SECRET environment variable is missing"
            )
        })

        it("throws error when NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing", () => {
            delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

            expect(() => getGoogleOAuthConfig()).toThrow(
                "NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is missing"
            )
        })

        it("throws error when NEXT_PUBLIC_GOOGLE_REDIRECT_URI is missing", () => {
            delete process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI

            expect(() => getGoogleOAuthConfig()).toThrow(
                "NEXT_PUBLIC_GOOGLE_REDIRECT_URI environment variable is missing"
            )
        })

        it("throws error when client IDs do not match", () => {
            process.env.GOOGLE_CLIENT_ID = "client-id-1"
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "client-id-2"

            expect(() => getGoogleOAuthConfig()).toThrow(
                "GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_CLIENT_ID must be the same"
            )
        })

        it("throws error when redirect URI does not start with http:// or https://", () => {
            process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI =
                "ftp://localhost:3000/callback"

            expect(() => getGoogleOAuthConfig()).toThrow(
                "NEXT_PUBLIC_GOOGLE_REDIRECT_URI must start with http:// or https://"
            )
        })
    })

    describe("isGoogleOAuthConfigured", () => {
        it("returns true when all environment variables are set", () => {
            expect(isGoogleOAuthConfigured()).toBe(true)
        })

        it("returns false when GOOGLE_CLIENT_ID is missing", () => {
            delete process.env.GOOGLE_CLIENT_ID
            expect(isGoogleOAuthConfigured()).toBe(false)
        })

        it("returns false when GOOGLE_CLIENT_SECRET is missing", () => {
            delete process.env.GOOGLE_CLIENT_SECRET
            expect(isGoogleOAuthConfigured()).toBe(false)
        })

        it("returns false when NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing", () => {
            delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
            expect(isGoogleOAuthConfigured()).toBe(false)
        })

        it("returns false when NEXT_PUBLIC_GOOGLE_REDIRECT_URI is missing", () => {
            delete process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
            expect(isGoogleOAuthConfigured()).toBe(false)
        })
    })

    describe("getGoogleOAuthAuthorizationUrl", () => {
        it("returns valid authorization URL with all required parameters", () => {
            const state = "test-state-token"
            const url = getGoogleOAuthAuthorizationUrl(state)

            expect(url).toContain(
                "https://accounts.google.com/o/oauth2/v2/auth"
            )
            expect(url).toContain("client_id=test-client-id")
            expect(url).toContain(
                "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fgoogle%2Fcallback"
            )
            expect(url).toContain("response_type=code")
            expect(url).toContain("scope=email+profile")
            expect(url).toContain("state=test-state-token")
            expect(url).toContain("access_type=offline")
            expect(url).toContain("prompt=consent")
        })

        it("throws error when Google OAuth is not configured", () => {
            delete process.env.GOOGLE_CLIENT_ID

            expect(() => getGoogleOAuthAuthorizationUrl("state")).toThrow()
        })
    })

    describe("getGoogleOAuthTokenEndpoint", () => {
        it("returns correct token endpoint URL", () => {
            const endpoint = getGoogleOAuthTokenEndpoint()
            expect(endpoint).toBe("https://oauth2.googleapis.com/token")
        })
    })

    describe("getGoogleOAuthUserInfoEndpoint", () => {
        it("returns correct user info endpoint URL", () => {
            const endpoint = getGoogleOAuthUserInfoEndpoint()
            expect(endpoint).toBe(
                "https://www.googleapis.com/oauth2/v2/userinfo"
            )
        })
    })

    describe("validateGoogleOAuthRedirectUri", () => {
        it("returns true when redirect URI matches configured URI", () => {
            const isValid = validateGoogleOAuthRedirectUri(
                "http://localhost:3000/api/auth/google/callback"
            )
            expect(isValid).toBe(true)
        })

        it("returns false when redirect URI does not match configured URI", () => {
            const isValid = validateGoogleOAuthRedirectUri(
                "http://localhost:3000/api/auth/different-callback"
            )
            expect(isValid).toBe(false)
        })

        it("returns false when Google OAuth is not configured", () => {
            delete process.env.GOOGLE_CLIENT_ID

            const isValid = validateGoogleOAuthRedirectUri(
                "http://localhost:3000/api/auth/google/callback"
            )
            expect(isValid).toBe(false)
        })
    })

    describe("getGoogleOAuthScopes", () => {
        it("returns correct OAuth scopes", () => {
            const scopes = getGoogleOAuthScopes()
            expect(scopes).toEqual(["email", "profile"])
        })
    })
})
