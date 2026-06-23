/**
 * Unit Tests: YouTube Upload Adapter
 * Tests for uploadVideo and postToYouTube
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Hoisted mocks ──
const mockGetValidToken = vi.hoisted(() => vi.fn())
const mockVideosInsert = vi.hoisted(() => vi.fn())
const mockGoogleAuth = vi.hoisted(() => vi.fn())

vi.mock("@/lib/youtube/get-valid-token", () => ({
    getValidYouTubeToken: mockGetValidToken,
}))

vi.mock("googleapis", () => {
    class MockOAuth2 {
        setCredentials = vi.fn()
    }
    return {
        google: {
            auth: {
                OAuth2: MockOAuth2,
            },
            youtube: () => ({
                videos: {
                    insert: mockVideosInsert,
                },
            }),
        },
    }
})

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }),
}))

const { uploadVideo, postToYouTube } =
    await import("@/lib/posting/adapters/youtube")

describe("uploadVideo", () => {
    const userId = "user-123"
    const videoBuffer = Buffer.from("fake-video-content")
    const config = {
        title: "Test Video",
        description: "Test description",
        tags: ["tag1", "tag2"],
        privacyStatus: "unlisted" as const,
        categoryId: "22",
    }

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.YOUTUBE_CLIENT_ID = "test-client-id"
        process.env.YOUTUBE_CLIENT_SECRET = "test-client-secret"
    })

    it("uploads video successfully", async () => {
        mockGetValidToken.mockResolvedValue("valid-token")
        mockVideosInsert.mockResolvedValue({
            data: { id: "abc123" },
        })

        const result = await uploadVideo(userId, videoBuffer, config)

        expect(result.success).toBe(true)
        expect(result.videoId).toBe("abc123")
        expect(result.url).toBe("https://youtube.com/watch?v=abc123")
        expect(mockGetValidToken).toHaveBeenCalledWith(userId)
        expect(mockVideosInsert).toHaveBeenCalledTimes(1)
    })

    it("returns error if YouTube returns no video ID", async () => {
        mockGetValidToken.mockResolvedValue("valid-token")
        mockVideosInsert.mockResolvedValue({
            data: { id: undefined },
        })

        const result = await uploadVideo(userId, videoBuffer, config)

        expect(result.success).toBe(false)
        expect(result.error).toContain("no video ID")
    })

    it("returns error if token is missing", async () => {
        mockGetValidToken.mockResolvedValue(null)

        const result = await uploadVideo(userId, videoBuffer, config)

        expect(result.success).toBe(false)
        expect(result.error).toContain("not linked")
        expect(mockVideosInsert).not.toHaveBeenCalled()
    })

    it("returns error on YouTube API failure", async () => {
        mockGetValidToken.mockResolvedValue("valid-token")
        mockVideosInsert.mockRejectedValue(
            new Error("quotaExceeded: daily limit")
        )

        const result = await uploadVideo(userId, videoBuffer, config)

        expect(result.success).toBe(false)
        expect(result.error).toContain("quotaExceeded")
    })
})

describe("postToYouTube", () => {
    it("returns error for text-only posts", async () => {
        const result = await postToYouTube({
            title: "title",
            description: "desc",
            privacyStatus: "public",
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain("video uploads")
    })
})
