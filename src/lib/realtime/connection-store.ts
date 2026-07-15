/**
 * Connection Store
 * Manages SSE connections per user. Each user can have multiple connections
 * (e.g., multiple browser tabs). Provides broadcast, cleanup, and lookup.
 */

import { createLogger } from "@/lib/logger"

const logger = createLogger("ConnectionStore")

export interface Connection {
    id: string
    controller: ReadableStreamDefaultController<Uint8Array>
    createdAt: number
    lastHeartbeat: number
}

const STALE_CONNECTION_MS = 30_000
const CLEANUP_INTERVAL_MS = 15_000

class ConnectionStore {
    private connections: Map<string, Map<string, Connection>> = new Map()
    private cleanupTimer: ReturnType<typeof setInterval> | null = null

    constructor() {
        this.startCleanup()
    }

    /**
     * Add a connection for a user
     */
    add(userId: string, connection: Connection): void {
        if (!this.connections.has(userId)) {
            this.connections.set(userId, new Map())
        }
        this.connections.get(userId)!.set(connection.id, connection)
        logger.debug("Connection added", {
            userId,
            connectionId: connection.id,
        })
    }

    /**
     * Remove a connection for a user
     */
    remove(userId: string, connectionId: string): void {
        const userConnections = this.connections.get(userId)
        if (!userConnections) return

        userConnections.delete(connectionId)
        logger.debug("Connection removed", { userId, connectionId })

        if (userConnections.size === 0) {
            this.connections.delete(userId)
        }
    }

    /**
     * Get all connections for a user
     */
    getConnectionsByUser(userId: string): Connection[] {
        const userConnections = this.connections.get(userId)
        if (!userConnections) return []
        return Array.from(userConnections.values())
    }

    /**
     * Broadcast an event to all connections of a user
     */
    broadcast(
        userId: string,
        event: string,
        data: Record<string, unknown>
    ): void {
        const connections = this.getConnectionsByUser(userId)
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        const encoded = new TextEncoder().encode(message)

        for (const connection of connections) {
            try {
                connection.controller.enqueue(encoded)
            } catch (error) {
                logger.warn("Failed to enqueue to connection", {
                    userId,
                    connectionId: connection.id,
                    error: String(error),
                })
                this.remove(userId, connection.id)
            }
        }
    }

    /**
     * Remove stale connections (no heartbeat > 30s)
     */
    cleanup(): void {
        const now = Date.now()
        let removedCount = 0

        for (const [userId, userConnections] of this.connections.entries()) {
            for (const [
                connectionId,
                connection,
            ] of userConnections.entries()) {
                if (now - connection.lastHeartbeat > STALE_CONNECTION_MS) {
                    try {
                        connection.controller.close()
                    } catch {
                        // Already closed
                    }
                    userConnections.delete(connectionId)
                    removedCount++
                    logger.debug("Removed stale connection", {
                        userId,
                        connectionId,
                    })
                }
            }

            if (userConnections.size === 0) {
                this.connections.delete(userId)
            }
        }

        if (removedCount > 0) {
            logger.debug("Stale connections cleaned up", { removedCount })
        }
    }

    /**
     * Update heartbeat timestamp for a connection
     */
    heartbeat(userId: string, connectionId: string): void {
        const userConnections = this.connections.get(userId)
        if (!userConnections) return

        const connection = userConnections.get(connectionId)
        if (connection) {
            connection.lastHeartbeat = Date.now()
        }
    }

    /**
     * Get connection count for a user
     */
    getConnectionCount(userId: string): number {
        return this.connections.get(userId)?.size ?? 0
    }

    /**
     * Get total active connections across all users
     */
    getTotalConnections(): number {
        let total = 0
        for (const userConnections of this.connections.values()) {
            total += userConnections.size
        }
        return total
    }

    /**
     * Start periodic cleanup
     */
    private startCleanup(): void {
        if (this.cleanupTimer) return
        this.cleanupTimer = setInterval(
            () => this.cleanup(),
            CLEANUP_INTERVAL_MS
        )
    }

    /**
     * Stop periodic cleanup and clear all connections
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
            this.cleanupTimer = null
        }

        for (const [, userConnections] of this.connections.entries()) {
            for (const [, connection] of userConnections.entries()) {
                try {
                    connection.controller.close()
                } catch {
                    // Already closed
                }
            }
            userConnections.clear()
        }
        this.connections.clear()
        logger.info("Connection store destroyed")
    }
}

// Singleton export
export const connectionStore = new ConnectionStore()
