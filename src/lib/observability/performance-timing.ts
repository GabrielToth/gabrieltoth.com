// Performance Timing Middleware
// Implements Requirement 12.7 from distributed-infrastructure-logging spec

import { NextFunction, Request, Response } from "express"
import { createLogger } from "../logger"

const logger = createLogger("PerformanceTiming")

export interface TimingContext {
    startTime: number
    requestId?: string
}

/**
 * Middleware to track request performance timing
 */
export const performanceTimingMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const startTime = Date.now()
    const requestId = req.headers["x-request-id"] as string

    // Store timing context
    ;(req as any).timingContext = {
        startTime,
        requestId,
    }

    // Intercept response finish
    const originalEnd = res.end
    res.end = function (this: Response, ...args: any[]): Response {
        const duration = Date.now() - startTime

        // Add timing header
        res.setHeader("X-Response-Time", `${duration}ms`)

        // Log timing at debug level
        logger.debug("Request completed", {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            requestId,
        })

        // Call original end
        return originalEnd.apply(this, args)
    }

    next()
}

/**
 * Get current request duration
 */
export const getRequestDuration = (req: Request): number => {
    const timingContext = (req as any).timingContext as
        | TimingContext
        | undefined
    if (!timingContext) return 0

    return Date.now() - timingContext.startTime
}
