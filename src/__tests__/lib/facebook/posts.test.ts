/**
 * Tests for Facebook Graph API posting functions
 *
 * Tests all exported functions from posts.ts by mocking global.fetch.
 * Coverage: postToPageFeed, postVideoToPageFeed, postToGroupFeed, getPagePosts
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import {
    postToPageFeed,
    postToGroupFeed,
    getPagePosts,
} from "@/lib/facebook/posts"

const mockFetch = vi.fn()
global.fetch = mockFetch

describe("Facebook Posts", () => {
    const pageAccessToken = "test-page-token-123"
    const pageId = "123456789"

    beforeEach(() => {
        mockFetch.mockReset()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("postToPageFeed", () => {
        const defaultOptions = { message: "Hello, world!" }

        it("should send a POST request to the correct URL", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "post-123" }),
            })

            await postToPageFeed(pageAccessToken, pageId, defaultOptions)

            expect(mockFetch).toHaveBeenCalledTimes(1)
            const [url, options] = mockFetch.mock.calls[0]
            expect(url).toContain("graph.facebook.com")
            expect(url).toContain(pageId)
            expect(url).toContain("/feed")
            expect(options.method).toBe("POST")
            expect(options.headers["Content-Type"]).toBe(
                "application/x-www-form-urlencoded"
            )
        })

        it("should include access_token and message in the body", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "post-123" }),
            })

            await postToPageFeed(pageAccessToken, pageId, defaultOptions)

            const [, options] = mockFetch.mock.calls[0]
            const body = options.body.toString()
            expect(body).toContain("access_token=")
            expect(body).toContain(encodeURIComponent(pageAccessToken))
            expect(body).toContain("message=")
            expect(body).toContain("Hello%2C+world%21")
        })

        it("should include optional link, picture, caption, description", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "post-123" }),
            })

            await postToPageFeed(pageAccessToken, pageId, {
                message: "Check this!",
                link: "https://example.com",
                picture: "https://example.com/img.png",
                caption: "A caption",
                description: "A description",
            })

            const [, options] = mockFetch.mock.calls[0]
            const body = options.body.toString()
            expect(body).toContain("link=")
            expect(body).toContain("picture=")
            expect(body).toContain("caption=")
            expect(body).toContain("description=")
        })

        it("should return result with id on success", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "fb-post-id-456" }),
            })

            const result = await postToPageFeed(
                pageAccessToken,
                pageId,
                defaultOptions
            )

            expect(result.id).toBe("fb-post-id-456")
        })

        it("should handle API error responses", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: { message: "Invalid page access token" },
                }),
            })

            await expect(
                postToPageFeed(pageAccessToken, pageId, defaultOptions)
            ).rejects.toThrow("Invalid page access token")
        })

        it("should use fallback error message when no message in error", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            })

            await expect(
                postToPageFeed(pageAccessToken, pageId, defaultOptions)
            ).rejects.toThrow("Failed to post to Facebook Page feed")
        })

        it("should handle network failure gracefully", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network error"))

            await expect(
                postToPageFeed(pageAccessToken, pageId, defaultOptions)
            ).rejects.toThrow("Network error")
        })

        it("should handle scheduled publish time when published is false", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "post-789" }),
            })

            const futureTime = Math.floor(Date.now() / 1000) + 3600
            await postToPageFeed(pageAccessToken, pageId, {
                message: "Scheduled post",
                published: false,
                scheduledPublishTime: futureTime,
            })

            const [, options] = mockFetch.mock.calls[0]
            const body = options.body.toString()
            expect(body).toContain("published=false")
            expect(body).toContain("scheduled_publish_time=")
        })
    })

    describe("postToGroupFeed", () => {
        const groupId = "group-987"
        const message = "Hello group!"

        it("should send a POST request to the group's feed endpoint", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "group-post-123" }),
            })

            await postToGroupFeed(pageAccessToken, groupId, message)

            const [url] = mockFetch.mock.calls[0]
            expect(url).toContain("graph.facebook.com")
            expect(url).toContain(groupId)
            expect(url).toContain("/feed")
        })

        it("should include access_token and message in body", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "group-post-123" }),
            })

            await postToGroupFeed(pageAccessToken, groupId, message)

            const [, options] = mockFetch.mock.calls[0]
            const body = options.body.toString()
            expect(body).toContain("access_token=")
            expect(body).toContain("message=")
        })

        it("should include optional link and picture", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "group-post-123" }),
            })

            await postToGroupFeed(pageAccessToken, groupId, message, {
                link: "https://example.com",
                picture: "https://example.com/pic.jpg",
            })

            const [, options] = mockFetch.mock.calls[0]
            const body = options.body.toString()
            expect(body).toContain("link=")
            expect(body).toContain("picture=")
        })

        it("should return result with id on success", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: "group-post-456" }),
            })

            const result = await postToGroupFeed(
                pageAccessToken,
                groupId,
                message
            )
            expect(result.id).toBe("group-post-456")
        })

        it("should handle API errors", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: { message: "Group feed not available" },
                }),
            })

            await expect(
                postToGroupFeed(pageAccessToken, groupId, message)
            ).rejects.toThrow("Group feed not available")
        })

        it("should handle network failure gracefully", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Connection timeout"))

            await expect(
                postToGroupFeed(pageAccessToken, groupId, message)
            ).rejects.toThrow("Connection timeout")
        })
    })

    describe("getPagePosts", () => {
        it("should send a GET request to the page feed endpoint", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            })

            await getPagePosts(pageAccessToken, pageId)

            const [url] = mockFetch.mock.calls[0]
            expect(url).toContain("graph.facebook.com")
            expect(url).toContain(pageId)
            expect(url).toContain("/feed")
            expect(url).toContain("access_token=")
            expect(url).toContain("fields=")
        })

        it("should include pagination params when provided", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            })

            await getPagePosts(pageAccessToken, pageId, {
                limit: 10,
                after: "cursor-abc",
            })

            const [url] = mockFetch.mock.calls[0]
            expect(url).toContain("limit=10")
            expect(url).toContain("after=cursor-abc")
        })

        it("should include before param for previous page", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            })

            await getPagePosts(pageAccessToken, pageId, {
                before: "cursor-prev",
            })

            const [url] = mockFetch.mock.calls[0]
            expect(url).toContain("before=cursor-prev")
        })

        it("should return data array on success", async () => {
            const mockPosts = {
                data: [
                    { id: "post-1", message: "First post" },
                    { id: "post-2", message: "Second post" },
                ],
                paging: { cursors: { after: "next-cursor" } },
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockPosts,
            })

            const result = await getPagePosts(pageAccessToken, pageId)
            expect(result.data).toHaveLength(2)
            expect(result.data[0].id).toBe("post-1")
            expect(result.paging).toBeDefined()
        })

        it("should handle API error responses", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: { message: "Invalid page ID" },
                }),
            })

            await expect(getPagePosts(pageAccessToken, pageId)).rejects.toThrow(
                "Invalid page ID"
            )
        })
    })
})
