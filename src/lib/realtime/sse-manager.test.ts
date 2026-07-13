/**
 * Tests for SSEManager
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { connectionStore, type Connection } from "./connection-store"

// Mock connection-store
vi.mock("./connection-store", () => {
    const mockConnections = new Map<string, Map<string, Connection>>()

    const mockConnectionStore = {
        add: vi.fn((userId: string, connection: Connection) => {
            if (!mockConnections.has(userId)) {
                mockConnections.set(userId, new Map())
            }
            mockConnections.get(userId)!.set(connection.id, connection)
        }),
        remove: vi.fn((userId: string, connectionId: string) => {
            const userConns = mockConnections.get(userId)
            if (userConns) {
                userConns.delete(connectionId)
                if (userConns.size === 0) mockConnections.delete(userId)
            }
        }),
        getConnectionsByUser: vi.fn((userId: string) => {
            const userConns = mockConnections.get(userId)
            return userConns ? Array.from(userConns.values()) : []
        }),
        broadcast: vi.fn(),
        heartbeat: vi.fn(),
        cleanup: vi.fn(),
        getConnectionCount: vi.fn(() => 0),
        getTotalConnections: vi.fn(() => 0),
        destroy: vi.fn(),
    }

    return { connectionStore: mockConnectionStore, Connection: {} as Connection }
})

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

describe("SSEManager", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("createSSEStream", () => {
        it("should return a response with SSE headers", async () => {
            const { createSSEStream } = await import("./sse-manager")

            const request = new Request("http://localhost:3000/api/live/chat/stream", {
                signal: new AbortController().signal,
            })

            const { response, connectionId } = createSSEStream(request, "user-1")

            expect(response.headers.get("Content-Type")).toBe(
                "text/event-stream"
            )
            expect(response.headers.get("Cache-Control")).toBe(
                "no-cache, no-store, must-revalidate"
            )
            expect(response.headers.get("Connection")).toBe("keep-alive")
            expect(connectionId).toBeTruthy()
            expect(typeof connectionId).toBe("string")
        })

        it("should add connection to store", async () => {
            const { createSSEStream } = await import("./sse-manager")

            const request = new Request("http://localhost:3000/api/live/chat/stream", {
                signal: new AbortController().signal,
            })

            createSSEStream(request, "user-1")

            expect(connectionStore.add).toHaveBeenCalledWith(
                "user-1",
                expect.objectContaining({
                    id: expect.any(String),
                })
            )
        })

        it("should remove connection on abort", async () => {
            const { createSSEStream } = await import("./sse-manager")
            const controller = new AbortController()

            const request = new Request("http://localhost:3000/api/live/chat/stream", {
                signal: controller.signal,
            })

            createSSEStream(request, "user-1")

            // Trigger abort
            controller.abort()

            // Wait for microtasks
            await vi.waitFor(() => {
                expect(connectionStore.remove).toHaveBeenCalled()
            })
        })
    })

    describe("sendEvent", () => {
        it("should broadcast to connection store", async () => {
            const { sendEvent } = await import("./sse-manager")

            sendEvent("user-1", "message", { content: "hello" })

            expect(connectionStore.broadcast).toHaveBeenCalledWith(
                "user-1",
                "message",
                { content: "hello" }
            )
        })
    })

    describe("closeConnections", () => {
        it("should close and remove all connections for a user", async () => {
            const { closeConnections } = await import("./sse-manager")

            const mockClose = vi.fn()
            vi.mocked(connectionStore.getConnectionsByUser).mockReturnValue([
                {
                    id: "conn-1",
                    controller: { close: mockClose } as unknown as ReadableStreamDefaultController<Uint8Array>,
                    createdAt: Date.now(),
                    lastHeartbeat: Date.now(),
                },
            ])

            closeConnections("user-1")

            expect(mockClose).toHaveBeenCalled()
            expect(connectionStore.remove).toHaveBeenCalledWith(
                "user-1",
                "conn-1"
            )
        })
    })
})
