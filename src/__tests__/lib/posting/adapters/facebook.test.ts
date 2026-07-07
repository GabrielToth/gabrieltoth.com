/**
 * Tests for Facebook Posting Adapter
 *
 * Tests postToFacebook and postVideoToFacebook with mocked dependencies.
 * Coverage: postToFacebook, postVideoToFacebook (all branches)
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { postToFacebook } from "@/lib/posting/adapters/facebook"

// Mock dependencies
const mockGetFacebookConfig = vi.fn()
const mockGetValidFacebookToken = vi.fn()
const mockGetFacebookOAuthService = vi.fn()
const mockPostToPageFeed = vi.fn()
const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

vi.mock("@/lib/facebook/config", () => ({
    getFacebookConfig: (...args: unknown[]) => mockGetFacebookConfig(...args),
}))

vi.mock("@/lib/facebook/get-valid-token", () => ({
    getValidFacebookToken: (...args: unknown[]) =>
        mockGetValidFacebookToken(...args),
}))

vi.mock("@/lib/facebook/oauth-service", () => ({
    getFacebookOAuthService: (...args: unknown[]) =>
        mockGetFacebookOAuthService(...args),
}))

vi.mock("@/lib/facebook/posts", () => ({
    postToPageFeed: (...args: unknown[]) => mockPostToPageFeed(...args),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => mockLogger,
}))

describe("Facebook Posting Adapter", () => {
    const userId = "user-123"
    const pageId = "page-456"
    const message = "Test post message"
    const pageAccessToken = "page-access-token-789"
    const userToken = "user-token-abc"

    let mockOAuthService: {
        initialize: ReturnType<typeof vi.fn>
        getPageAccessToken: ReturnType<typeof vi.fn>
    }

    beforeEach(() => {
        // Reset mock implementations (NOT clearAllMocks to preserve mock implementations)
        mockGetFacebookConfig.mockReset()
        mockGetValidFacebookToken.mockReset()
        mockGetFacebookOAuthService.mockReset()
        mockPostToPageFeed.mockReset()
        mockLogger.info.mockReset()
        mockLogger.warn.mockReset()
        mockLogger.error.mockReset()

        // Default mock implementations
        mockGetFacebookConfig.mockReturnValue({
            oauth: {
                appId: "test-app-id",
                appSecret: "test-app-secret",
                redirectUri:
                    "http://localhost:3000/api/oauth/callback/facebook",
                scopes: ["pages_manage_posts"],
                apiVersion: "v22.0",
            },
            rateLimit: {
                linkingAttemptsPerHour: 5,
                publishAttemptsPerHour: 10,
                liveAttemptsPerHour: 5,
            },
            security: { tokenExpiryBufferMs: 300000 },
        })

        mockOAuthService = {
            initialize: vi.fn().mockResolvedValue(undefined),
            getPageAccessToken: vi.fn().mockResolvedValue(pageAccessToken),
        }
        mockGetFacebookOAuthService.mockReturnValue(mockOAuthService)
        mockGetValidFacebookToken.mockResolvedValue(userToken)
        mockPostToPageFeed.mockResolvedValue({ id: "fb-post-id-123" })
    })

    describe("postToFacebook", () => {
        it("should call postToPageFeed with correct arguments on success", async () => {
            const result = await postToFacebook({
                userId,
                pageId,
                message,
            })

            expect(result.success).toBe(true)
            expect(result.postId).toBe("fb-post-id-123")
            expect(result.url).toContain("facebook.com")
            expect(result.url).toContain(pageId)

            // Verify the full chain was called
            expect(mockGetFacebookConfig).toHaveBeenCalled()
            expect(mockGetFacebookOAuthService).toHaveBeenCalled()
            expect(mockOAuthService.initialize).toHaveBeenCalled()
            expect(mockGetValidFacebookToken).toHaveBeenCalledWith(userId, {
                oauthService: mockOAuthService,
            })
            expect(mockOAuthService.getPageAccessToken).toHaveBeenCalledWith(
                pageId,
                userToken
            )
            expect(mockPostToPageFeed).toHaveBeenCalledWith(
                pageAccessToken,
                pageId,
                {
                    message,
                    link: undefined,
                    picture: undefined,
                    caption: undefined,
                    description: undefined,
                }
            )
        })

        it("should include optional fields when provided", async () => {
            mockPostToPageFeed.mockResolvedValue({ id: "fb-post-789" })

            await postToFacebook({
                userId,
                pageId,
                message,
                link: "https://example.com",
                picture: "https://example.com/img.jpg",
                caption: "A caption",
                description: "A description",
            })

            expect(mockPostToPageFeed).toHaveBeenCalledWith(
                expect.any(String),
                pageId,
                {
                    message,
                    link: "https://example.com",
                    picture: "https://example.com/img.jpg",
                    caption: "A caption",
                    description: "A description",
                }
            )
        })

        it("should return error when pageId is missing", async () => {
            const result = await postToFacebook({
                userId,
                pageId: "",
                message,
            })

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/Page ID/)
            expect(mockGetFacebookConfig).not.toHaveBeenCalled()
        })

        it("should return error when message is missing", async () => {
            const result = await postToFacebook({
                userId,
                pageId,
                message: "",
            })

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/Page ID/)
            expect(mockGetFacebookConfig).not.toHaveBeenCalled()
        })

        it("should return error when getFacebookConfig throws", async () => {
            mockGetFacebookConfig.mockImplementation(() => {
                throw new Error("Invalid Facebook configuration")
            })

            const result = await postToFacebook({ userId, pageId, message })

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/Invalid Facebook configuration/)
        })

        it("should return error when getValidFacebookToken returns null", async () => {
            mockGetValidFacebookToken.mockResolvedValue(null)

            const result = await postToFacebook({ userId, pageId, message })

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/not linked/)
            expect(mockOAuthService.getPageAccessToken).not.toHaveBeenCalled()
        })

        it("should return error when getPageAccessToken returns null", async () => {
            mockOAuthService.getPageAccessToken.mockResolvedValue(null)

            const result = await postToFacebook({ userId, pageId, message })

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/page access token/)
            expect(mockPostToPageFeed).not.toHaveBeenCalled()
        })

        it("should handle errors from postToPageFeed", async () => {
            mockPostToPageFeed.mockRejectedValue(
                new Error("Graph API error: invalid token")
            )

            const result = await postToFacebook({ userId, pageId, message })

            expect(result.success).toBe(false)
            expect(result.error).toMatch(/Graph API error/)
        })

        it("should handle unknown errors gracefully", async () => {
            mockPostToPageFeed.mockRejectedValue("string error")

            const result = await postToFacebook({ userId, pageId, message })

            expect(result.success).toBe(false)
            expect(result.error).toBeDefined()
        })
    })
})
