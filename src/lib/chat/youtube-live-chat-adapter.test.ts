/**
 * Tests for YouTube Live Chat Adapter
 *
 * Tests the YouTubeLiveChatAdapter by mocking global.fetch.
 * Coverage: connect, disconnect, sendMessage, getHistory, polling, error handling.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { YouTubeLiveChatAdapter } from "./youtube-live-chat-adapter"

const mockFetch = vi.fn()
global.fetch = mockFetch

describe("YouTubeLiveChatAdapter", () => {
    const roomId = "my-channel"
    const token = "test-youtube-token-123"
    const liveChatId = "Cg0KCnRlc3RfbGl2ZV9jDFgBKJgB"

    let adapter: YouTubeLiveChatAdapter

    beforeEach(() => {
        mockFetch.mockReset()
        vi.useFakeTimers()
        adapter = new YouTubeLiveChatAdapter()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    const mockLiveBroadcastsResponse = (overrides = {}) => ({
        items: [
            {
                id: "broadcast-1",
                snippet: {
                    liveChatId,
                    title: "Test Stream",
                    actualStartTime: new Date().toISOString(),
                },
                status: {
                    lifeCycleStatus: "live",
                    privacyStatus: "public",
                },
            },
        ],
        pollingIntervalMillis: 5000,
        ...overrides,
    })

    const mockLiveChatMessagesResponse = (messages: any[] = []) => ({
        items: messages,
        nextPageToken: messages.length > 0 ? "next-page-token" : undefined,
        pollingIntervalMillis: 5000,
    })

    const makeMessage = (overrides = {}) => ({
        id: "msg-1",
        snippet: {
            type: "textMessageEvent",
            publishedAt: new Date().toISOString(),
            displayMessage: "Hello from YouTube!",
            textMessageDetails: {
                messageText: "Hello from YouTube!",
            },
            authorChannelId: "channel-123",
        },
        authorDetails: {
            channelId: "channel-123",
            displayName: "TestUser",
            profileImageUrl: "https://example.com/avatar.png",
            isChatModerator: false,
            isChatOwner: false,
            isChatSponsor: false,
            isVerified: false,
        },
        ...overrides,
    })

    describe("connect", () => {
        it("should find active broadcast and start polling", async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveBroadcastsResponse(),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () =>
                        mockLiveChatMessagesResponse([makeMessage()]),
                })

            await adapter.connect(roomId, token)

            // Should have called liveBroadcasts endpoint
            expect(mockFetch).toHaveBeenCalledTimes(2)
            expect(mockFetch.mock.calls[0][0]).toContain(
                "/youtube/v3/liveBroadcasts"
            )
            expect(mockFetch.mock.calls[0][0]).toContain("mine=true")

            // Should have called liveChat/messages
            expect(mockFetch.mock.calls[1][0]).toContain(
                "/youtube/v3/liveChat/messages"
            )
            expect(mockFetch.mock.calls[1][0]).toContain(
                `liveChatId=${liveChatId}`
            )

            const room = await adapter.getRoom(roomId)
            expect(room).not.toBeNull()
            expect(room!.platform).toBe("youtube")
            expect(room!.isLive).toBe(true)
        })

        it("should throw error when no active broadcast found", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [] }),
            })

            await expect(adapter.connect(roomId, token)).rejects.toThrow(
                "No active YouTube live broadcast found for this channel"
            )
        })

        it("should throw error when broadcasts API fails", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: async () => "Invalid credentials",
            })

            await expect(adapter.connect(roomId, token)).rejects.toThrow(
                "Failed to fetch YouTube live broadcasts"
            )
        })
    })

    describe("polling", () => {
        it("should receive messages and notify handlers", async () => {
            const handler = vi.fn()

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveBroadcastsResponse(),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () =>
                        mockLiveChatMessagesResponse([makeMessage()]),
                })

            // Register handler before connect to catch the initial poll
            adapter.onMessage(roomId, handler)
            await adapter.connect(roomId, token)

            expect(handler).toHaveBeenCalled()
            const chatMessage = handler.mock.calls[0][0]
            expect(chatMessage.platform).toBe("youtube")
            expect(chatMessage.content).toBe("Hello from YouTube!")
        })

        it("should not re-emit duplicate messages", async () => {
            const handler = vi.fn()
            const message = makeMessage()

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveBroadcastsResponse(),
                })
                // Initial poll (now awaited inside connect)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveChatMessagesResponse([message]),
                })
                // Second poll
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveChatMessagesResponse([message]),
                })

            // Register handler before connect to catch the initial poll
            adapter.onMessage(roomId, handler)
            await adapter.connect(roomId, token)

            // Initial poll should have delivered 1 message
            expect(handler).toHaveBeenCalledTimes(1)

            // Second poll — same messages should not trigger handler
            await vi.advanceTimersByTimeAsync(5000)
            expect(handler).toHaveBeenCalledTimes(1)
        })

        it("should handle empty poll response without crashing", async () => {
            const handler = vi.fn()

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveBroadcastsResponse(),
                })
                // Initial poll (awaited inside connect)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveChatMessagesResponse([]),
                })
                // Timer poll
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveChatMessagesResponse([]),
                })

            // Register handler before connect
            adapter.onMessage(roomId, handler)
            await adapter.connect(roomId, token)

            expect(handler).not.toHaveBeenCalled()

            await vi.advanceTimersByTimeAsync(5000)
            expect(handler).not.toHaveBeenCalled()
        })

        it("should trigger onError when API returns error during poll", async () => {
            const errorHandler = vi.fn()

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveBroadcastsResponse(),
                })
                // Initial poll (awaited inside connect)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveChatMessagesResponse([]),
                })
                // Timer poll — error
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    text: async () => "Rate limit exceeded",
                })

            // Register handler before connect
            adapter.onError(errorHandler)
            await adapter.connect(roomId, token)

            await vi.advanceTimersByTimeAsync(5000)
            await vi.advanceTimersByTimeAsync(5000)

            expect(errorHandler).toHaveBeenCalled()
            expect(errorHandler.mock.calls[0][0].message).toContain(
                "Failed to fetch YouTube live chat messages"
            )
        })
    })

    describe("disconnect", () => {
        it("should stop polling and clear state", async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveBroadcastsResponse(),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveChatMessagesResponse([]),
                })

            await adapter.connect(roomId, token)
            await adapter.disconnect(roomId)

            const room = await adapter.getRoom(roomId)
            expect(room).toBeNull()
        })

        it("should not throw when disconnecting from unconnected room", async () => {
            await expect(
                adapter.disconnect("non-existent-room")
            ).resolves.not.toThrow()
        })
    })

    describe("sendMessage", () => {
        it("should post message to YouTube API", async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveBroadcastsResponse(),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveChatMessagesResponse([]),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: "sent-msg-1" }),
                })

            await adapter.connect(roomId, token)
            const messageId = await adapter.sendMessage(roomId, "Test message")

            expect(messageId).toBeTruthy()
            expect(mockFetch.mock.calls[2][0]).toContain(
                "/youtube/v3/liveChat/messages?part=snippet"
            )
            expect(mockFetch.mock.calls[2][1].method).toBe("POST")

            const body = JSON.parse(mockFetch.mock.calls[2][1].body)
            expect(body.snippet.liveChatId).toBe(liveChatId)
            expect(body.snippet.textMessageDetails.messageText).toBe(
                "Test message"
            )
        })

        it("should throw when not connected", async () => {
            await expect(adapter.sendMessage(roomId, "Hello")).rejects.toThrow(
                "Not connected to YouTube live chat"
            )
        })

        it("should throw when message exceeds max length", async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveBroadcastsResponse(),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveChatMessagesResponse([]),
                })

            await adapter.connect(roomId, token)
            const longMessage = "x".repeat(201)

            await expect(
                adapter.sendMessage(roomId, longMessage)
            ).rejects.toThrow("Message exceeds YouTube max length of 200")
        })
    })

    describe("getHistory", () => {
        it("should return messages from fetch", async () => {
            const msg1 = makeMessage({
                id: "msg-1",
                snippet: {
                    ...makeMessage().snippet,
                    displayMessage: "First message",
                    textMessageDetails: { messageText: "First message" },
                },
            })
            const msg2 = makeMessage({
                id: "msg-2",
                snippet: {
                    ...makeMessage().snippet,
                    displayMessage: "Second message",
                    textMessageDetails: { messageText: "Second message" },
                },
            })

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveBroadcastsResponse(),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () =>
                        mockLiveChatMessagesResponse([msg1, msg2]),
                })
                // Second call for getHistory
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () =>
                        mockLiveChatMessagesResponse([msg1, msg2]),
                })

            await adapter.connect(roomId, token)

            // Clear seen IDs so getHistory returns messages
            const history = await adapter.getHistory(roomId)

            expect(history).toHaveLength(2)
            expect(history[0].content).toBe("First message")
            expect(history[1].content).toBe("Second message")
        })

        it("should return empty array when not connected", async () => {
            const history = await adapter.getHistory(roomId)
            expect(history).toEqual([])
        })
    })

    describe("message types", () => {
        it("should map superChatEvent to announcement type", async () => {
            const handler = vi.fn()

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockLiveBroadcastsResponse(),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () =>
                        mockLiveChatMessagesResponse([
                            makeMessage({
                                snippet: {
                                    ...makeMessage().snippet,
                                    type: "superChatEvent",
                                },
                            }),
                        ]),
                })

            // Register handler before connect to catch the initial poll
            adapter.onMessage(roomId, handler)
            await adapter.connect(roomId, token)

            expect(handler.mock.calls[0][0].type).toBe("announcement")
        })
    })
})
