/**
 * SSE Manager
 * Manages Server-Sent Events streams: creates SSE responses, sends events,
 * heartbeats, and cleanup on abort.
 */

import { createLogger } from "@/lib/logger"
import { connectionStore, type Connection } from "./connection-store"

const logger = createLogger("SSEManager")

const HEARTBEAT_INTERVAL_MS = 15_000

const SSE_HEADERS: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
}

/**
 * Create an SSE stream response for a given user
 */
export function createSSEStream(
    request: Request,
    userId: string
): { response: Response; connectionId: string } {
    const connectionId = crypto.randomUUID()
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null

    const stream = new ReadableStream<Uint8Array>({
        start(controller: ReadableStreamDefaultController<Uint8Array>) {
            const connection: Connection = {
                id: connectionId,
                controller,
                createdAt: Date.now(),
                lastHeartbeat: Date.now(),
            }

            connectionStore.add(userId, connection)

            // Start heartbeats
            heartbeatTimer = setInterval(() => {
                try {
                    const heartbeat = `:heartbeat\n\n`
                    controller.enqueue(new TextEncoder().encode(heartbeat))
                    connectionStore.heartbeat(userId, connectionId)
                } catch {
                    cleanup()
                }
            }, HEARTBEAT_INTERVAL_MS)

            // Send initial connected event
            const connected = `event: connected\ndata: ${JSON.stringify({ connectionId })}\n\n`
            controller.enqueue(new TextEncoder().encode(connected))

            logger.debug("SSE stream started", { userId, connectionId })
        },
        cancel() {
            cleanup()
        },
    })

    function cleanup(): void {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer)
            heartbeatTimer = null
        }
        connectionStore.remove(userId, connectionId)
        logger.debug("SSE stream closed", { userId, connectionId })
    }

    // Handle request abort
    request.signal.addEventListener("abort", () => {
        cleanup()
    })

    const response = new Response(stream, {
        headers: SSE_HEADERS,
    })

    return { response, connectionId }
}

/**
 * Send an event to a user's SSE connections
 */
export function sendEvent(
    userId: string,
    event: string,
    data: Record<string, unknown>
): void {
    connectionStore.broadcast(userId, event, data)
}

/**
 * Close all connections for a user
 */
export function closeConnections(userId: string): void {
    const connections = connectionStore.getConnectionsByUser(userId)
    for (const connection of connections) {
        try {
            connection.controller.close()
        } catch {
            // Already closed
        }
        connectionStore.remove(userId, connection.id)
    }
    logger.debug("All connections closed for user", { userId })
}
