/**
 * Tests for Facebook Live Chat Adapter
 *
 * Tests the FacebookLiveChatAdapter by mocking facebook/live.ts and
 * facebook/comments.ts module functions.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { FacebookLiveChatAdapter } from "./facebook-live-chat-adapter"

// Mock facebook/live.ts functions
vi.mock("../facebook/live", () => ({
    getLiveVideos: vi.fn(),
    getLiveComments: vi.fn(),
}))

// Mock facebook/comments.ts functions
vi.mock("../facebook/comments", () => ({
    replyToComment: vi.fn(),
}))

import { getLiveVideos, getLiveComments } from "../facebook/live"
import { replyToComment } from "../facebook/comments"

describe("FacebookLiveChatAdapter", () => {
    const roomId = "my-page-id"
    const token = "test-facebook-token-123"
    const liveVideoId = "live-video-456"

    let adapter: FacebookLiveChatAdapter

    beforeEach(() => {
        vi.clearAllMocks()
        adapter = new FacebookLiveChatAdapter()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    const mockLiveVideo = {
        id: liveVideoId,
        status: "LIVE",
        title: "Test Live Stream",
        permalinkUrl: "https://facebook.com/watch/live-video-456",
    }

    const mockComment = (overrides = {}) => ({
        id: "comment-1",
        message: "Great stream!",
        from: { name: "John Doe", id: "user-123" },
        created_time: new Date().toISOString(),
        ...overrides,
    })

    describe("connect", () => {
        it("should find active live video and start polling", async () => {
            vi.mocked(getLiveVideos).mockResolvedValueOnce({
                data: [mockLiveVideo],
            })
            vi.mocked(getLiveComments).mockResolvedValueOnce({
                data: [mockComment()],
            })

            await adapter.connect(roomId, token)

            expect(getLiveVideos).toHaveBeenCalledWith(token, roomId, {
                limit: 10,
            })

            const room = await adapter.getRoom(roomId)
            expect(room).not.toBeNull()
            expect(room!.platform).toBe("facebook")
            expect(room!.isLive).toBe(true)
        })

        it("should throw error when no active live video found", async () => {
            vi.mocked(getLiveVideos).mockResolvedValueOnce({
                data: [],
            })

            await expect(adapter.connect(roomId, token)).rejects.toThrow(
                "No active Facebook Live video found for this page"
            )
        })

        it("should skip non-live videos and find only LIVE status", async () => {
            vi.mocked(getLiveVideos).mockResolvedValueOnce({
                data: [
                    { ...mockLiveVideo, status: "VOD" },
                    { ...mockLiveVideo, id: "live-789", status: "LIVE" },
                ],
            })
            vi.mocked(getLiveComments).mockResolvedValueOnce({
                data: [mockComment()],
            })

            await adapter.connect(roomId, token)

            // Should have connected to the LIVE video (second one)
            const room = await adapter.getRoom(roomId)
            expect(room).not.toBeNull()

            // getLiveComments should have been called with the LIVE video ID
            expect(getLiveComments).toHaveBeenCalledWith(token, "live-789")
        })

        it("should handle API error when fetching live videos", async () => {
            vi.mocked(getLiveVideos).mockRejectedValueOnce(
                new Error("Invalid page access token")
            )

            await expect(adapter.connect(roomId, token)).rejects.toThrow(
                "Invalid page access token"
            )
        })
    })

    describe("message delivery", () => {
        it("should deliver comments to registered handler on connect", async () => {
            const handler = vi.fn()

            vi.mocked(getLiveVideos).mockResolvedValueOnce({
                data: [mockLiveVideo],
            })
            vi.mocked(getLiveComments).mockResolvedValueOnce({
                data: [mockComment()],
            })

            adapter.onMessage(roomId, handler)
            await adapter.connect(roomId, token)

            expect(handler).toHaveBeenCalled()
            const chatMessage = handler.mock.calls[0][0]
            expect(chatMessage.platform).toBe("facebook")
            expect(chatMessage.content).toBe("Great stream!")
        })

        it("should deliver only unique comment IDs (deduplicate)", async () => {
            const handler = vi.fn()
            const comment = mockComment()

            vi.mocked(getLiveVideos).mockResolvedValueOnce({
                data: [mockLiveVideo],
            })
            // Return same comment twice in one batch
            vi.mocked(getLiveComments).mockResolvedValueOnce({
                data: [comment, comment],
            })

            adapter.onMessage(roomId, handler)
            await adapter.connect(roomId, token)

            // Handler should only be called once for the unique ID
            expect(handler).toHaveBeenCalledTimes(1)
        })

        it("should trigger onError when initial poll fails", async () => {
            const errorHandler = vi.fn()

            vi.mocked(getLiveVideos).mockResolvedValueOnce({
                data: [mockLiveVideo],
            })
            vi.mocked(getLiveComments).mockRejectedValueOnce(
                new Error("Facebook API rate limit exceeded")
            )

            adapter.onError(errorHandler)
            // pollCycle catches errors internally and notifies via onError,
            // so connect() still resolves (does not throw)
            await adapter.connect(roomId, token)

            expect(errorHandler).toHaveBeenCalled()
            expect(errorHandler.mock.calls[0][0].message).toBe(
                "Facebook API rate limit exceeded"
            )
        })
    })

    describe("disconnect", () => {
        it("should clear state and stop polling", async () => {
            vi.mocked(getLiveVideos).mockResolvedValueOnce({
                data: [mockLiveVideo],
            })
            vi.mocked(getLiveComments).mockResolvedValueOnce({
                data: [mockComment()],
            })

            await adapter.connect(roomId, token)
            await adapter.disconnect(roomId)

            const room = await adapter.getRoom(roomId)
            expect(room).toBeNull()
        })

        it("should not throw on disconnect from unconnected room", async () => {
            await expect(
                adapter.disconnect("non-existent")
            ).resolves.not.toThrow()
        })
    })

    describe("sendMessage", () => {
        it("should call replyToComment with correct parameters", async () => {
            vi.mocked(getLiveVideos).mockResolvedValueOnce({
                data: [mockLiveVideo],
            })
            vi.mocked(getLiveComments).mockResolvedValueOnce({
                data: [mockComment()],
            })
            vi.mocked(replyToComment).mockResolvedValueOnce({
                id: "reply-123",
            })

            await adapter.connect(roomId, token)
            const messageId = await adapter.sendMessage(
                roomId,
                "Hello from dashboard!"
            )

            expect(messageId).toBe("reply-123")
            expect(replyToComment).toHaveBeenCalledWith(
                token,
                liveVideoId,
                "Hello from dashboard!"
            )
        })

        it("should throw when not connected", async () => {
            await expect(adapter.sendMessage(roomId, "Test")).rejects.toThrow(
                "Not connected to Facebook live chat"
            )
        })

        it("should throw when message exceeds max length", async () => {
            vi.mocked(getLiveVideos).mockResolvedValueOnce({
                data: [mockLiveVideo],
            })
            vi.mocked(getLiveComments).mockResolvedValueOnce({
                data: [mockComment()],
            })

            await adapter.connect(roomId, token)
            const longMessage = "x".repeat(501)

            await expect(
                adapter.sendMessage(roomId, longMessage)
            ).rejects.toThrow("Message exceeds Facebook max length of 500")
        })
    })

    describe("getHistory", () => {
        it("should fetch and return comments", async () => {
            vi.mocked(getLiveVideos).mockResolvedValueOnce({
                data: [mockLiveVideo],
            })
            vi.mocked(getLiveComments)
                .mockResolvedValueOnce({
                    data: [mockComment()], // initial poll during connect
                })
                .mockResolvedValue({
                    data: [
                        mockComment({ id: "c1", message: "First!" }),
                        mockComment({ id: "c2", message: "Second!" }),
                    ], // getHistory call
                })

            await adapter.connect(roomId, token)
            const history = await adapter.getHistory(roomId)

            expect(history).toHaveLength(2)
            expect(history[0].content).toBe("First!")
            expect(history[1].content).toBe("Second!")
        })

        it("should return empty array when not connected", async () => {
            const history = await adapter.getHistory(roomId)
            expect(history).toEqual([])
        })
    })
})
