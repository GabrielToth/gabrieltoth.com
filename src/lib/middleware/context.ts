// Request Context Middleware
// Focus: Request tracing, User context propagation

import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

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
    const requestId = request.headers.get("x-request-id") || randomUUID()
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
