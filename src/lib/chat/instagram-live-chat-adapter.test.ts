/**
 * Tests for Instagram Live Chat Adapter
 *
 * Tests the InstagramLiveChatAdapter by mocking instagram/comments.ts
 * module functions and global.fetch for the media lookup.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { InstagramLiveChatAdapter } from "./instagram-live-chat-adapter"

// Mock instagram/comments.ts functions
vi.mock("../instagram/comments", () => ({
    getComments: vi.fn(),
    replyToComment: vi.fn(),
}))

import { getComments, replyToComment } from "../instagram/comments"

const mockFetch = vi.fn()
global.fetch = mockFetch

describe("InstagramLiveChatAdapter", () => {
    const roomId = "ig-user-123"
    const token = "test-instagram-token-456"
    const mediaId = "media-789"

    let adapter: InstagramLiveChatAdapter

    beforeEach(() => {
        vi.useFakeTimers()
        vi.clearAllMocks()
        mockFetch.mockReset()
        adapter = new InstagramLiveChatAdapter()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    const mockMediaResponse = (overrides = {}) => ({
        data: [
            {
                id: mediaId,
                media_type: "LIVE",
                media_product_type: "LIVE",
                permalink: "https://instagram.com/p/live-123",
            },
        ],
        ...overrides,
    })

    const mockComment = (overrides = {}) => ({
        id: "comment-1",
        text: "Awesome live!",
        timestamp: new Date().toISOString(),
        username: "jane_doe",
        ...overrides,
    })

    describe("connect", () => {
        it("should find LIVE media and start polling", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockMediaResponse(),
            })
            vi.mocked(getComments).mockResolvedValueOnce({
                data: [mockComment()],
            })

            await adapter.connect(roomId, token)

            expect(mockFetch).toHaveBeenCalledTimes(1)
            expect(mockFetch.mock.calls[0][0]).toContain(
                `/v25.0/${roomId}/media`
            )
            expect(mockFetch.mock.calls[0][0]).toContain("media_type")

            const room = await adapter.getRoom(roomId)
            expect(room).not.toBeNull()
            expect(room!.platform).toBe("instagram")
            expect(room!.isLive).toBe(true)
        })

        it("should throw error when no LIVE media found", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ data: [] }),
            })

            await expect(adapter.connect(roomId, token)).rejects.toThrow(
                "No active Instagram Live media found for this account"
            )
        })

        it("should throw error when media API fails", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: { message: "Invalid Instagram token" },
                }),
            })

            await expect(adapter.connect(roomId, token)).rejects.toThrow(
                "Invalid Instagram token"
            )
        })

        it("should handle media API network error", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network failure"))

            await expect(adapter.connect(roomId, token)).rejects.toThrow(
                "Network failure"
            )
        })
    })

    describe("polling", () => {
        it("should deliver new comments via onMessage", async () => {
            const handler = vi.fn()

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockMediaResponse(),
            })
            vi.mocked(getComments).mockResolvedValueOnce({
                data: [mockComment()], // initial poll
            })

            // Register handler before connect to catch initial poll
            adapter.onMessage(roomId, handler)
            await adapter.connect(roomId, token)

            expect(handler).toHaveBeenCalled()
            const chatMessage = handler.mock.calls[0][0]
            expect(chatMessage.platform).toBe("instagram")
            expect(chatMessage.content).toBe("Awesome live!")
        })

        it("should not re-emit duplicate comment IDs", async () => {
            const handler = vi.fn()
            const comment = mockComment()

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockMediaResponse(),
            })
            vi.mocked(getComments)
                .mockResolvedValueOnce({
                    data: [comment], // initial poll
                })
                .mockResolvedValueOnce({
                    data: [comment], // second poll — same comment
                })

            // Register handler before connect to catch initial poll
            adapter.onMessage(roomId, handler)
            await adapter.connect(roomId, token)

            // Initial poll delivered 1 message
            expect(handler).toHaveBeenCalledTimes(1)

            // Second poll — same comment should not trigger handler
            await vi.advanceTimersByTimeAsync(5000)
            expect(handler).toHaveBeenCalledTimes(1)
        })

        it("should propagate API error during poll to error handler", async () => {
            const errorHandler = vi.fn()

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockMediaResponse(),
            })
            vi.mocked(getComments)
                .mockResolvedValueOnce({
                    data: [mockComment()],
                })
                .mockRejectedValueOnce(
                    new Error("Instagram API rate limit exceeded")
                )

            await adapter.connect(roomId, token)
            adapter.onError(errorHandler)

            await vi.advanceTimersByTimeAsync(5000)
            await vi.advanceTimersByTimeAsync(5000)

            expect(errorHandler).toHaveBeenCalled()
            expect(errorHandler.mock.calls[0][0].message).toBe(
                "Instagram API rate limit exceeded"
            )
        })
    })

    describe("disconnect", () => {
        it("should stop polling and clear state", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockMediaResponse(),
            })
            vi.mocked(getComments).mockResolvedValueOnce({
                data: [mockComment()],
            })

            await adapter.connect(roomId, token)
            await adapter.disconnect(roomId)

            const room = await adapter.getRoom(roomId)
            expect(room).toBeNull()
        })

        it("should not throw when disconnecting from unconnected room", async () => {
            await expect(
                adapter.disconnect("non-existent")
            ).resolves.not.toThrow()
        })
    })

    describe("sendMessage", () => {
        it("should call replyToComment with correct parameters", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockMediaResponse(),
            })
            vi.mocked(getComments).mockResolvedValueOnce({
                data: [mockComment()],
            })
            vi.mocked(replyToComment).mockResolvedValueOnce({
                id: "reply-123",
            })

            await adapter.connect(roomId, token)
            const messageId = await adapter.sendMessage(
                roomId,
                "Love the stream!"
            )

            expect(messageId).toBe("reply-123")
            expect(replyToComment).toHaveBeenCalledWith(
                token,
                roomId,
                mediaId,
                "Love the stream!"
            )
        })

        it("should throw when not connected", async () => {
            await expect(adapter.sendMessage(roomId, "Test")).rejects.toThrow(
                "Not connected to Instagram live chat"
            )
        })

        it("should throw when message exceeds max length", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockMediaResponse(),
            })
            vi.mocked(getComments).mockResolvedValueOnce({
                data: [mockComment()],
            })

            await adapter.connect(roomId, token)
            const longMessage = "x".repeat(501)

            await expect(
                adapter.sendMessage(roomId, longMessage)
            ).rejects.toThrow("Message exceeds Instagram max length of 500")
        })
    })

    describe("getHistory", () => {
        it("should fetch and return comments", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockMediaResponse(),
            })
            vi.mocked(getComments)
                .mockResolvedValueOnce({
                    data: [mockComment()], // initial poll during connect
                })
                .mockResolvedValueOnce({
                    data: [
                        mockComment({ id: "c1", text: "First!" }),
                        mockComment({ id: "c2", text: "Second!" }),
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
