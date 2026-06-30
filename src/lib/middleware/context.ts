// Request Context Middleware
// Focus: Request tracing
// Note: x-user-id is NOT trusted from client headers — must come from session/auth middleware

import { NextRequest, NextResponse } from "next/server"

function generateRequestId(): string {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)

    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export interface RequestContext {
    requestId: string
    startTime: number
    path: string
    method: string
}

export function contextMiddleware(request: NextRequest): NextResponse {
    const requestId = request.headers.get("x-request-id") || generateRequestId()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const context: RequestContext = {
        requestId,
        startTime: Date.now(),
        path: request.nextUrl.pathname,
        method: request.method,
    }

    const response = NextResponse.next()
    response.headers.set("X-Request-ID", requestId)

    return response
}

export function getRequestContext(headers: Headers): Partial<RequestContext> {
    return {
        requestId: headers.get("x-request-id") || undefined,
    }
}

export default contextMiddleware
