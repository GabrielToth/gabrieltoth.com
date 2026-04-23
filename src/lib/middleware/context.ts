// Request Context Middleware
// Focus: Request tracing, User context propagation

import { generateUUID } from "@/lib/crypto-utils"
import { NextRequest, NextResponse } from "next/server"

/**
 * Generate a UUID v4 that works in Edge Runtime
 * Uses crypto.getRandomValues() which is available in Edge Runtime
 */
function generateUUID(): string {
    // Generate 16 random bytes
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)

    // Set version to 4 (random)
    bytes[6] = (bytes[6] & 0x0f) | 0x40

    // Set variant to RFC 4122
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    // Convert to hex string with dashes
    const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export interface RequestContext {
    requestId: string
    userId?: string
    startTime: number
    path: string
    method: string
}

/**
 * Middleware to attach request context
 * Generates or extracts requestId, extracts userId from headers
 */
export function contextMiddleware(request: NextRequest): NextResponse {
    const requestId = request.headers.get("x-request-id") || generateUUID()
    const userId = request.headers.get("x-user-id") || undefined

    const context: RequestContext = {
        requestId,
        userId,
        startTime: Date.now(),
        path: request.nextUrl.pathname,
        method: request.method,
    }

    // Create response
    const response = NextResponse.next()

    // Set response headers
    response.headers.set("X-Request-ID", requestId)

    // Store context in request (for use in API routes)
    // Note: In Next.js 13+, we use headers() to access this in server components

    return response
}

/**
 * Helper to get request context from headers (for use in API routes)
 */
export function getRequestContext(headers: Headers): Partial<RequestContext> {
    return {
        requestId: headers.get("x-request-id") || undefined,
        userId: headers.get("x-user-id") || undefined,
    }
}

export default contextMiddleware
