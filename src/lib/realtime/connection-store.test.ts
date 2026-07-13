/**
 * Tests for ConnectionStore
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { connectionStore, type Connection } from "./connection-store"

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

function createMockConnection(overrides: Partial<Connection> = {}): Connection {
    return {
        id: overrides.id ?? "conn-1",
        controller: {
            enqueue: vi.fn(),
            close: vi.fn(),
            error: vi.fn(),
            desiredSize: 1,
        } as unknown as ReadableStreamDefaultController<Uint8Array>,
        createdAt: overrides.createdAt ?? Date.now(),
        lastHeartbeat: overrides.lastHeartbeat ?? Date.now(),
        ...overrides,
    }
}

describe("connectionStore", () => {
    beforeEach(() => {
        // Clear all connections between tests
        connectionStore["connections"].clear()
        vi.useRealTimers()
    })

    describe("add", () => {
        it("should add a connection for a user", () => {
            const conn = createMockConnection({ id: "conn-1" })
            connectionStore.add("user-1", conn)

            expect(connectionStore.getConnectionCount("user-1")).toBe(1)
        })

        it("should allow multiple connections for the same user", () => {
            const conn1 = createMockConnection({ id: "conn-1" })
            const conn2 = createMockConnection({ id: "conn-2" })
            connectionStore.add("user-1", conn1)
            connectionStore.add("user-1", conn2)

            expect(connectionStore.getConnectionCount("user-1")).toBe(2)
        })
    })

    describe("remove", () => {
        it("should remove a connection for a user", () => {
            const conn = createMockConnection({ id: "conn-1" })
            connectionStore.add("user-1", conn)
            connectionStore.remove("user-1", "conn-1")

            expect(connectionStore.getConnectionCount("user-1")).toBe(0)
        })

        it("should do nothing if user has no connections", () => {
            connectionStore.remove("nonexistent", "conn-1")
            expect(connectionStore.getTotalConnections()).toBe(0)
        })
    })

    describe("getConnectionsByUser", () => {
        it("should return all connections for a user", () => {
            const conn1 = createMockConnection({ id: "conn-1" })
            const conn2 = createMockConnection({ id: "conn-2" })
            connectionStore.add("user-1", conn1)
            connectionStore.add("user-1", conn2)

            const connections = connectionStore.getConnectionsByUser("user-1")
            expect(connections).toHaveLength(2)
            expect(connections.map(c => c.id)).toEqual(
                expect.arrayContaining(["conn-1", "conn-2"])
            )
        })

        it("should return empty array for unknown user", () => {
            const connections = connectionStore.getConnectionsByUser("unknown")
            expect(connections).toEqual([])
        })
    })

    describe("broadcast", () => {
        it("should enqueue message to all user connections", () => {
            const conn1 = createMockConnection({ id: "conn-1" })
            const conn2 = createMockConnection({ id: "conn-2" })
            connectionStore.add("user-1", conn1)
            connectionStore.add("user-1", conn2)

            connectionStore.broadcast("user-1", "message", {
                content: "hello",
            })

            expect(conn1.controller.enqueue).toHaveBeenCalledTimes(1)
            expect(conn2.controller.enqueue).toHaveBeenCalledTimes(1)
        })

        it("should not enqueue to other users", () => {
            const conn1 = createMockConnection({ id: "conn-1" })
            const conn2 = createMockConnection({ id: "conn-2" })
            connectionStore.add("user-1", conn1)
            connectionStore.add("user-2", conn2)

            connectionStore.broadcast("user-1", "message", {
                content: "hello",
            })

            expect(conn1.controller.enqueue).toHaveBeenCalledTimes(1)
            expect(conn2.controller.enqueue).not.toHaveBeenCalled()
        })
    })

    describe("heartbeat", () => {
        it("should update lastHeartbeat timestamp", () => {
            const conn = createMockConnection({
                id: "conn-1",
                lastHeartbeat: 0,
            })
            connectionStore.add("user-1", conn)

            connectionStore.heartbeat("user-1", "conn-1")

            const connections = connectionStore.getConnectionsByUser("user-1")
            expect(connections[0].lastHeartbeat).toBeGreaterThan(0)
        })

        it("should do nothing for unknown connection", () => {
            connectionStore.heartbeat("unknown", "conn-1")
            // Should not throw
        })
    })

    describe("cleanup", () => {
        it("should remove connections with lastHeartbeat older than 30s", () => {
            vi.useFakeTimers()
            const now = Date.now()

            const freshConn = createMockConnection({
                id: "fresh",
                createdAt: now,
                lastHeartbeat: now,
            })
            const staleConn = createMockConnection({
                id: "stale",
                createdAt: now - 40_000,
                lastHeartbeat: now - 40_000,
            })

            connectionStore.add("user-1", freshConn)
            connectionStore.add("user-1", staleConn)

            connectionStore.cleanup()

            const remaining = connectionStore.getConnectionsByUser("user-1")
            expect(remaining).toHaveLength(1)
            expect(remaining[0].id).toBe("fresh")
        })
    })

    describe("getTotalConnections", () => {
        it("should return total across all users", () => {
            connectionStore.add("user-1", createMockConnection({ id: "c1" }))
            connectionStore.add("user-1", createMockConnection({ id: "c2" }))
            connectionStore.add("user-2", createMockConnection({ id: "c3" }))

            expect(connectionStore.getTotalConnections()).toBe(3)
        })
    })

    describe("destroy", () => {
        it("should clear all connections", () => {
            connectionStore.add("user-1", createMockConnection({ id: "c1" }))
            connectionStore.add("user-2", createMockConnection({ id: "c2" }))

            connectionStore.destroy()

            expect(connectionStore.getTotalConnections()).toBe(0)
        })
    })
})
