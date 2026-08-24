/**
 * Tests for Kick Chat Adapter
 * Covers WebSocket connection, message handling, disconnect, reconnection with backoff
 */

import { KickChatAdapter } from "@/lib/chat/kick-adapter"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Track all WebSocket instances
const wsInstances: MockWebSocket[] = []

class MockWebSocket {
    static OPEN = 1
    readyState = MockWebSocket.OPEN
    onopen: (() => void) | null = null
    onmessage: ((event: { data: string }) => void) | null = null
    onerror: ((event: Event) => void) | null = null
    onclose: (() => void) | null = null
    send = vi.fn()
    close = vi.fn()
    url: string

    constructor(url: string) {
        this.url = url
        wsInstances.push(this)

        // Trigger connection opening and immediate connection_established pusher message
        setTimeout(() => {
            if (this.onopen) this.onopen()
            this.simulateMessage({
                event: "pusher:connection_established",
                data: JSON.stringify({ socket_id: "123.456" }),
            })
        }, 0)
    }

    /** Simulate receiving a WebSocket message */
    simulateMessage(data: Record<string, unknown>): void {
        if (this.onmessage) {
            this.onmessage({ data: JSON.stringify(data) })
        }
    }

    /** Simulate WebSocket close */
    simulateClose(): void {
        if (this.onclose) this.onclose()
    }

    /** Simulate WebSocket error */
    simulateError(): void {
        if (this.onerror) {
            this.onerror(new Event("error"))
        }
    }
}

describe("KickChatAdapter", () => {
    let adapter: KickChatAdapter

    beforeEach(() => {
        vi.useFakeTimers()
        wsInstances.length = 0
        ;(globalThis as any).WebSocket = MockWebSocket as any
        adapter = new KickChatAdapter()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
        delete (globalThis as any).WebSocket
    })

    /** Connect and resolve all async operations */
    async function connectAndWait(
        channel = "kickchannel",
        token = "test-token"
    ): Promise<void> {
        const connectPromise = adapter.connect(channel, token)
        await vi.advanceTimersByTimeAsync(100)
        await connectPromise
    }

    /** Get the last created WebSocket instance */
    function getWs(): MockWebSocket {
        const ws = wsInstances[wsInstances.length - 1]
        if (!ws) throw new Error("No WebSocket instance created")
        return ws
    }

    describe("connect", () => {
        it("connects and sends join message", async () => {
            await connectAndWait()

            expect(wsInstances).toHaveLength(1)
            const ws = getWs()
            expect(ws.url).toContain("pusher.com")
            expect(ws.send).toHaveBeenCalledWith(
                expect.stringContaining("pusher:subscribe")
            )
        })

        it("does not reconnect if already connected", async () => {
            await connectAndWait()
            const initialCount = wsInstances.length

            await adapter.connect("kickchannel", "test-token")

            expect(wsInstances.length).toBe(initialCount)
        })

        it("rejects on connection timeout", async () => {
            // Create a WebSocket that never opens
            class TimeoutWs {
                static OPEN = 1
                readyState = 0
                onopen: (() => void) | null = null
                onmessage: ((event: { data: string }) => void) | null = null
                onerror: ((event: Event) => void) | null = null
                onclose: (() => void) | null = null
                send = vi.fn()
                close = vi.fn()
                constructor(public url: string) {
                    wsInstances.push(this as any)
                    // Intentionally do NOT call onopen
                }
            }
            ;(globalThis as any).WebSocket = TimeoutWs as any
            wsInstances.length = 0

            const connectPromise = adapter.connect(
                "timeoutchannel",
                "test-token"
            )
            const rejectPromise = expect(connectPromise).rejects.toThrow(
                "Kick Pusher connection timeout"
            )
            await vi.advanceTimersByTimeAsync(16000)
            await rejectPromise
        })
    })

    describe("onMessage", () => {
        it("receives chat message events", async () => {
            await connectAndWait()
            const handler = vi.fn()
            adapter.onMessage("kickchannel", handler)

            getWs().simulateMessage({
                event: "App\\Events\\ChatMessageEvent",
                data: JSON.stringify({
                    id: "msg_1",
                    sender: {
                        id: "user_1",
                        username: "KickUser",
                        identity: { badges: [] },
                    },
                    content: "Hello from Kick!",
                    created_at: Date.now(),
                }),
            })

            expect(handler).toHaveBeenCalledTimes(1)
            const msg = handler.mock.calls[0][0]
            expect(msg.platform).toBe("kick")
            expect(msg.content).toBe("Hello from Kick!")
            expect(msg.user.username.toLowerCase()).toBe("kickuser")
        })

        it("receives system events (join, leave, subscription)", async () => {
            await connectAndWait()
            const handler = vi.fn()
            adapter.onMessage("kickchannel", handler)

            // Simulate subscription
            getWs().simulateMessage({
                event: "App\\Events\\SubscriptionEvent",
                data: JSON.stringify({ username: "SubUser" }),
            })

            expect(handler).toHaveBeenCalledTimes(1)
        })
    })

    describe("sendMessage", () => {
        it("sends message via WebSocket", async () => {
            await connectAndWait()

            const msgId = await adapter.sendMessage(
                "kickchannel",
                "Hello Kick!"
            )

            expect(msgId).toBeTruthy()
        })

        it("throws if not connected", async () => {
            await expect(
                adapter.sendMessage("unknown", "test")
            ).rejects.toThrow("Not connected to Kick room: unknown")
        })
    })

    describe("getRoom", () => {
        it("returns room info when connected", async () => {
            await connectAndWait()

            const room = await adapter.getRoom("kickchannel")

            expect(room).not.toBeNull()
            expect(room!.id).toBe("kickchannel")
            expect(room!.platform).toBe("kick")
            expect(room!.isLive).toBe(true)
        })

        it("returns null when not connected", async () => {
            const room = await adapter.getRoom("unknown")
            expect(room).toBeNull()
        })
    })

    describe("getHistory", () => {
        it("returns empty array (not yet implemented)", async () => {
            const history = await adapter.getHistory("kickchannel", 50)
            expect(history).toEqual([])
        })
    })

    describe("disconnect", () => {
        it("disconnects and cleans up", async () => {
            await connectAndWait()
            getWs().send.mockClear()

            await adapter.disconnect("kickchannel")

            expect(getWs().close).toHaveBeenCalled()
        })
    })

    describe("reconnection", () => {
        it("reconnects on close with exponential backoff", async () => {
            await connectAndWait()
            const initialWsCount = wsInstances.length

            // Simulate WebSocket close
            getWs().simulateClose()

            // Advance past the initial reconnect delay (3s)
            vi.advanceTimersByTime(3100)
            await vi.advanceTimersByTimeAsync(10)

            // Should have created a new WebSocket connection
            expect(wsInstances.length).toBeGreaterThanOrEqual(
                initialWsCount + 1
            )
        })
    })

    describe("onError", () => {
        it("notifies error handler on WebSocket error", async () => {
            const errorHandler = vi.fn()
            adapter.onError(errorHandler)

            const connectPromise = adapter.connect("err-channel", "test-token")
            await vi.advanceTimersByTimeAsync(10)

            // The WebSocket error will cause both a rejection and error handler call
            // Note: behavior depends on the mock, so we just check handler was called
            getWs().simulateError()
            await vi.advanceTimersByTimeAsync(10)

            try {
                await connectPromise
            } catch {
                // Expected to reject
            }
            expect(errorHandler).toHaveBeenCalled()
        })
    })
})
