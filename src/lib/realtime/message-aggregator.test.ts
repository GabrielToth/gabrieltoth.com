/**
 * Tests for MessageAggregator
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// Create mock functions that can be referenced
const mockSendEvent = vi.fn()

vi.mock("./sse-manager", () => ({
    sendEvent: mockSendEvent,
    createSSEStream: vi.fn(),
    closeConnections: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
    }),
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
    },
}))

// Use real constructor functions for the mock adapters so `new` works
const mockConnect = vi.fn()
const mockDisconnect = vi.fn()
const mockOnMessage = vi.fn(() => vi.fn())
const mockOnError = vi.fn(() => vi.fn())

function createMockAdapter(platform: string) {
    return {
        platform,
        connect: mockConnect,
        disconnect: mockDisconnect,
        onMessage: mockOnMessage,
        onError: mockOnError,
        sendMessage: vi.fn(),
        getRoom: vi.fn(),
        getHistory: vi.fn(),
        config: {
            platform,
            enabled: true,
            maxMessageLength: 500,
            commands: [],
        },
    }
}

vi.mock("@/lib/chat", () => {
    function TwitchChatAdapter() {
        return createMockAdapter("twitch")
    }
    function KickChatAdapter() {
        return createMockAdapter("kick")
    }
    return { TwitchChatAdapter, KickChatAdapter }
})

describe("MessageAggregator", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockConnect.mockResolvedValue(undefined)
        mockDisconnect.mockResolvedValue(undefined)
    })

    describe("constructor", () => {
        it("should throw if no platforms provided", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            expect(() => new MessageAggregator("user-1", [])).toThrow(
                "At least one platform must be configured"
            )
        })

        it("should create instance with platforms", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])
            expect(aggregator).toBeInstanceOf(MessageAggregator)
        })
    })

    describe("start", () => {
        it("should connect to all configured platforms", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", [
                "twitch",
                "kick",
            ])

            await aggregator.start()

            expect(mockConnect).toHaveBeenCalledTimes(2)
        })

        it("should register message and error handlers", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            await aggregator.start()

            expect(mockOnMessage).toHaveBeenCalled()
            expect(mockOnError).toHaveBeenCalled()
        })

        it("should send status event for each platform", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            await aggregator.start()

            expect(mockSendEvent).toHaveBeenCalledWith("user-1", "status", {
                platform: "twitch",
                connected: true,
            })
        })

        it("should send error event on connection failure", async () => {
            mockConnect.mockRejectedValue(new Error("Connection refused"))

            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            await aggregator.start()

            expect(mockSendEvent).toHaveBeenCalledWith("user-1", "error", {
                platform: "twitch",
                error: "Connection refused",
            })
        })

        it("should not start twice", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            await aggregator.start()
            await aggregator.start()

            // connect should only be called once
            expect(mockConnect).toHaveBeenCalledTimes(1)
        })
    })

    describe("stop", () => {
        it("should disconnect all adapters", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            await aggregator.start()
            await aggregator.stop()

            expect(mockDisconnect).toHaveBeenCalled()
        })

        it("should send disconnected status events", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            await aggregator.start()
            await aggregator.stop()

            expect(mockSendEvent).toHaveBeenCalledWith("user-1", "status", {
                platform: "twitch",
                connected: false,
            })
        })

        it("should do nothing if not started", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            await aggregator.stop()

            expect(mockDisconnect).not.toHaveBeenCalled()
        })
    })

    describe("isRunning", () => {
        it("should return false before start", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            expect(aggregator.isRunning()).toBe(false)
        })

        it("should return true after start", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            await aggregator.start()

            expect(aggregator.isRunning()).toBe(true)
        })

        it("should return false after stop", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            await aggregator.start()
            await aggregator.stop()

            expect(aggregator.isRunning()).toBe(false)
        })
    })

    describe("getConnectedPlatforms", () => {
        it("should return empty array before start", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", ["twitch"])

            expect(aggregator.getConnectedPlatforms()).toEqual([])
        })

        it("should return connected platforms after start", async () => {
            const { MessageAggregator } = await import("./message-aggregator")
            const aggregator = new MessageAggregator("user-1", [
                "twitch",
                "kick",
            ])

            await aggregator.start()

            expect(aggregator.getConnectedPlatforms()).toEqual(
                expect.arrayContaining(["twitch", "kick"])
            )
        })
    })
})
