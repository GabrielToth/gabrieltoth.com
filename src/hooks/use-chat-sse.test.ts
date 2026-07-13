/**
 * Tests for useChatSSE hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useChatSSE } from "./use-chat-sse"

// Mock logger
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

type EventListenerCallback = (event: MessageEvent) => void

interface MockEventSource {
    close: ReturnType<typeof vi.fn>
    readyState: number
    CONNECTING: number
    OPEN: number
    CLOSED: number
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
    onerror: ((event: Event) => void) | null
    onmessage: ((event: MessageEvent) => void) | null
    onopen: ((event: Event) => void) | null
    url: string
    withCredentials: boolean
}

// Track event listeners per EventSource instance
const eventListeners: Map<MockEventSource, Map<string, Set<EventListenerCallback>>> =
    new Map()
let currentEventSource: MockEventSource | null = null
let eventSourceConstructorCalls: string[] = []

beforeEach(() => {
    eventListeners.clear()
    currentEventSource = null
    eventSourceConstructorCalls = []

    const mockEventSource: MockEventSource = {
        close: vi.fn(),
        readyState: 1,
        CONNECTING: 0,
        OPEN: 1,
        CLOSED: 2,
        addEventListener: vi.fn(
            (event: string, callback: EventListenerCallback) => {
                if (!eventListeners.has(mockEventSource)) {
                    eventListeners.set(mockEventSource, new Map())
                }
                const listeners = eventListeners.get(mockEventSource)!
                if (!listeners.has(event)) {
                    listeners.set(event, new Set())
                }
                listeners.get(event)!.add(callback)
            }
        ),
        removeEventListener: vi.fn(),
        onerror: null,
        onmessage: null,
        onopen: null,
        url: "",
        withCredentials: false,
    }

    currentEventSource = mockEventSource

    // Use a real constructor function so `new EventSource()` works
    const EventSourceMock = function (url: string) {
        eventSourceConstructorCalls.push(url)
        return mockEventSource
    }
    EventSourceMock.prototype.constructor = EventSourceMock
    vi.stubGlobal("EventSource", EventSourceMock as unknown)
})

afterEach(() => {
    vi.unstubAllGlobals()
})

/** Helper to simulate an SSE event on the current EventSource */
function simulateSSEEvent(event: string, data: string): void {
    if (!currentEventSource) return
    const listeners = eventListeners.get(currentEventSource)
    if (!listeners) return
    const eventListenersSet = listeners.get(event)
    if (!eventListenersSet) return
    const messageEvent = new MessageEvent(event, { data })
    for (const listener of eventListenersSet) {
        listener(messageEvent)
    }
}

describe("useChatSSE", () => {
    it("should create an EventSource to /api/live/chat/stream", () => {
        renderHook(() => useChatSSE(["twitch", "kick"]))

        expect(eventSourceConstructorCalls).toContain("/api/live/chat/stream")
    })

    it("should start with empty messages and disconnected state", () => {
        const { result } = renderHook(() => useChatSSE(["twitch"]))

        expect(result.current.messages).toEqual([])
        expect(result.current.statuses).toEqual([])
        expect(result.current.isConnected).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it("should add messages on 'message' event", () => {
        const { result } = renderHook(() => useChatSSE(["twitch"]))

        act(() => {
            simulateSSEEvent(
                "message",
                JSON.stringify({
                    id: "msg-1",
                    channelId: "channel-1",
                    platform: "twitch",
                    user: {
                        id: "user-1",
                        username: "testuser",
                        displayName: "TestUser",
                        platform: "twitch",
                        badges: [],
                    },
                    content: "Hello!",
                    type: "text",
                    timestamp: 1000000,
                })
            )
        })

        expect(result.current.messages).toHaveLength(1)
        expect(result.current.messages[0].id).toBe("msg-1")
        expect(result.current.messages[0].content).toBe("Hello!")
    })

    it("should accumulate multiple messages", () => {
        const { result } = renderHook(() => useChatSSE(["twitch"]))

        act(() => {
            simulateSSEEvent(
                "message",
                JSON.stringify({
                    id: "msg-1",
                    channelId: "channel-1",
                    platform: "twitch",
                    user: {
                        id: "u1",
                        username: "u1",
                        displayName: "U1",
                        platform: "twitch",
                        badges: [],
                    },
                    content: "First",
                    type: "text",
                    timestamp: 1000000,
                })
            )
        })

        act(() => {
            simulateSSEEvent(
                "message",
                JSON.stringify({
                    id: "msg-2",
                    channelId: "channel-1",
                    platform: "kick",
                    user: {
                        id: "u2",
                        username: "u2",
                        displayName: "U2",
                        platform: "kick",
                        badges: [],
                    },
                    content: "Second",
                    type: "text",
                    timestamp: 1000001,
                })
            )
        })

        expect(result.current.messages).toHaveLength(2)
        expect(result.current.messages[1].content).toBe("Second")
    })

    it("should update platform status on 'status' event", () => {
        const { result } = renderHook(() => useChatSSE(["twitch", "kick"]))

        act(() => {
            simulateSSEEvent(
                "status",
                JSON.stringify({
                    platform: "twitch",
                    connected: true,
                })
            )
        })

        expect(result.current.statuses).toHaveLength(1)
        expect(result.current.statuses[0]).toEqual({
            platform: "twitch",
            connected: true,
        })
    })

    it("should update existing platform status", () => {
        const { result } = renderHook(() => useChatSSE(["twitch"]))

        act(() => {
            simulateSSEEvent(
                "status",
                JSON.stringify({
                    platform: "twitch",
                    connected: true,
                })
            )
        })

        act(() => {
            simulateSSEEvent(
                "status",
                JSON.stringify({
                    platform: "twitch",
                    connected: false,
                })
            )
        })

        expect(result.current.statuses).toHaveLength(1)
        expect(result.current.statuses[0].connected).toBe(false)
    })

    it("should set error on 'error' event", () => {
        const { result } = renderHook(() => useChatSSE(["twitch"]))

        act(() => {
            simulateSSEEvent(
                "error",
                JSON.stringify({
                    platform: "twitch",
                    error: "Connection lost",
                })
            )
        })

        expect(result.current.error).toEqual({
            platform: "twitch",
            error: "Connection lost",
        })
    })

    it("should close EventSource on unmount", () => {
        const { unmount } = renderHook(() => useChatSSE(["twitch"]))

        unmount()

        expect(currentEventSource?.close).toHaveBeenCalled()
    })

    it("should pass platforms array", () => {
        const platforms = ["twitch", "kick"]
        const { result } = renderHook(() => useChatSSE(platforms))

        expect(result.current.messages).toEqual([])
    })
})
