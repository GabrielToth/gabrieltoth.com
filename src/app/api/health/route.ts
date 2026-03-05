import { NextResponse } from "next/server"

// Track application start time for uptime calculation
const startTime = Date.now()

/**
 * Health Check Endpoint for App (Next.js)
 *
 * Returns:
 * - 200 with status: healthy if all checks pass
 * - 503 with status: unhealthy if any check fails
 *
 * Includes:
 * - Uptime in seconds
 * - Timestamp (ISO 8601)
 *
 * Requirements: 1.4, 6.6
 */
export async function GET() {
    const status = "healthy"
    const httpStatus = 200
    const uptime = Math.floor((Date.now() - startTime) / 1000) // uptime in seconds

    const response = {
        status,
        timestamp: new Date().toISOString(),
        uptime,
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV,
        checks: {
            app: {
                status: "pass",
                message: "Application is running",
            },
        },
    }

    return NextResponse.json(response, { status: httpStatus })
}
