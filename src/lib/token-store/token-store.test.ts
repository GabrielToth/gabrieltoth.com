/**
 * Token Store Tests
 * Tests for secure token storage and retrieval
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { getTokenStore, resetTokenStore } from "./token-store"

describe("TokenStore", () => {
    beforeEach(() => {
        resetTokenStore()
        vi.clearAllMocks()
    })

    describe("storeToken", () => {
        it("should store a token securely", async () => {
            const tokenStore = getTokenStore()

            const tokenData = {
                accessToken: "test_access_token_12345",
                refreshToken: "test_refresh_token_67890",
                expiresAt: Date.now() + 3600000,
                platform: "youtube",
                userId: "user_123",
            }

            const result = await tokenStore.storeToken(tokenData)

            expect(result).toBeDefined()
            expect(result.userId).toBe(tokenData.userId)
            expect(result.platform).toBe(tokenData.platform)
            expect(result.encryptedToken).toBeDefined()
            expect(result.encryptedToken).not.toBe(tokenData.accessToken)
        })

        it("should update existing token", async () => {
            const tokenStore = getTokenStore()

            const tokenData = {
                accessToken: "test_access_token_12345",
                refreshToken: "test_refresh_token_67890",
                expiresAt: Date.now() + 3600000,
                platform: "youtube",
                userId: "user_123",
            }

            const result1 = await tokenStore.storeToken(tokenData)
            const result2 = await tokenStore.storeToken({
                ...tokenData,
                accessToken: "new_access_token_99999",
            })

            expect(result1.id).toBe(result2.id)
            expect(result1.updatedAt).toBeLessThanOrEqual(result2.updatedAt)
        })
    })

    describe("getToken", () => {
        it("should retrieve and decrypt a token", async () => {
            const tokenStore = getTokenStore()

            const tokenData = {
                accessToken: "test_access_token_12345",
                refreshToken: "test_refresh_token_67890",
                expiresAt: Date.now() + 3600000,
                platform: "youtube",
                userId: "user_123",
            }

            await tokenStore.storeToken(tokenData)
            const retrieved = await tokenStore.getToken(
                tokenData.userId,
                tokenData.platform
            )

            expect(retrieved).toBeDefined()
            expect(retrieved?.accessToken).toBe(tokenData.accessToken)
            expect(retrieved?.refreshToken).toBe(tokenData.refreshToken)
            expect(retrieved?.platform).toBe(tokenData.platform)
        })

        it("should return null for non-existent token", async () => {
            const tokenStore = getTokenStore()

            const retrieved = await tokenStore.getToken(
                "non_existent_user",
                "youtube"
            )

            expect(retrieved).toBeNull()
        })
    })

    describe("isTokenValid", () => {
        it("should return true for valid non-expired token", async () => {
            const tokenStore = getTokenStore()

            const tokenData = {
                accessToken: "test_access_token_12345",
                refreshToken: "test_refresh_token_67890",
                expiresAt: Date.now() + 3600000,
                platform: "youtube",
                userId: "user_123",
            }

            await tokenStore.storeToken(tokenData)
            const isValid = await tokenStore.isTokenValid(
                tokenData.userId,
                tokenData.platform
            )

            expect(isValid).toBe(true)
        })

        it("should return false for expired token", async () => {
            const tokenStore = getTokenStore()

            const tokenData = {
                accessToken: "test_access_token_12345",
                refreshToken: "test_refresh_token_67890",
                expiresAt: Date.now() - 1000, // Expired 1 second ago
                platform: "youtube",
                userId: "user_123",
            }

            await tokenStore.storeToken(tokenData)
            const isValid = await tokenStore.isTokenValid(
                tokenData.userId,
                tokenData.platform
            )

            expect(isValid).toBe(false)
        })

        it("should return false for non-existent token", async () => {
            const tokenStore = getTokenStore()

            const isValid = await tokenStore.isTokenValid(
                "non_existent_user",
                "youtube"
            )

            expect(isValid).toBe(false)
        })
    })

    describe("refreshToken", () => {
        it("should refresh an existing token", async () => {
            const tokenStore = getTokenStore()

            const tokenData = {
                accessToken: "test_access_token_12345",
                refreshToken: "test_refresh_token_67890",
                expiresAt: Date.now() + 3600000,
                platform: "youtube",
                userId: "user_123",
            }

            await tokenStore.storeToken(tokenData)

            const newTokenData = {
                accessToken: "new_access_token_99999",
                refreshToken: "new_refresh_token_88888",
                expiresAt: Date.now() + 7200000,
                platform: "youtube",
                userId: "user_123",
            }

            const result = await tokenStore.refreshToken(
                tokenData.userId,
                tokenData.platform,
                newTokenData
            )

            expect(result).toBeDefined()
            expect(result.updatedAt).toBeGreaterThan(0)

            const retrieved = await tokenStore.getToken(
                tokenData.userId,
                tokenData.platform
            )
            expect(retrieved?.accessToken).toBe(newTokenData.accessToken)
        })
    })

    describe("deleteToken", () => {
        it("should delete a token", async () => {
            const tokenStore = getTokenStore()

            const tokenData = {
                accessToken: "test_access_token_12345",
                refreshToken: "test_refresh_token_67890",
                expiresAt: Date.now() + 3600000,
                platform: "youtube",
                userId: "user_123",
            }

            await tokenStore.storeToken(tokenData)
            const deleted = await tokenStore.deleteToken(
                tokenData.userId,
                tokenData.platform
            )

            expect(deleted).toBe(true)

            const retrieved = await tokenStore.getToken(
                tokenData.userId,
                tokenData.platform
            )
            expect(retrieved).toBeNull()
        })
    })

    describe("getUserTokens", () => {
        it("should retrieve all tokens for a user", async () => {
            const tokenStore = getTokenStore()

            const userId = "user_123"

            const tokens = [
                {
                    accessToken: "youtube_token",
                    platform: "youtube",
                    userId,
                    expiresAt: Date.now() + 3600000,
                },
                {
                    accessToken: "facebook_token",
                    platform: "facebook",
                    userId,
                    expiresAt: Date.now() + 3600000,
                },
            ]

            for (const token of tokens) {
                await tokenStore.storeToken(token)
            }

            const userTokens = await tokenStore.getUserTokens(userId)

            expect(userTokens).toHaveLength(2)
            expect(userTokens.map(t => t.platform)).toContain("youtube")
            expect(userTokens.map(t => t.platform)).toContain("facebook")
        })
    })

    describe("hasTokens", () => {
        it("should return true if user has tokens", async () => {
            const tokenStore = getTokenStore()

            const tokenData = {
                accessToken: "test_access_token_12345",
                platform: "youtube",
                userId: "user_123",
                expiresAt: Date.now() + 3600000,
            }

            await tokenStore.storeToken(tokenData)
            const hasTokens = await tokenStore.hasTokens(tokenData.userId)

            expect(hasTokens).toBe(true)
        })

        it("should return false if user has no tokens", async () => {
            const tokenStore = getTokenStore()

            const hasTokens = await tokenStore.hasTokens("user_without_tokens")

            expect(hasTokens).toBe(false)
        })
    })

    describe("singleton pattern", () => {
        it("should return the same instance", () => {
            const instance1 = getTokenStore()
            const instance2 = getTokenStore()

            expect(instance1).toBe(instance2)
        })

        it("should reset the singleton", () => {
            const instance1 = getTokenStore()
            resetTokenStore()
            const instance2 = getTokenStore()

            expect(instance1).not.toBe(instance2)
        })
    })
})
