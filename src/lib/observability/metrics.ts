// Metrics Endpoint
// Implements Requirement 12.4 from distributed-infrastructure-logging spec

import { Request, Response } from "express"

export interface Metrics {
    requestCount: number
    errorCount: number
    uptime: number
    timestamp: string
}

class MetricsCollector {
    private requestCount = 0
    private errorCount = 0
    private startTime = Date.now()

    incrementRequests(): void {
        this.requestCount++
    }

    incrementErrors(): void {
        this.errorCount++
    }

    getMetrics(): Metrics {
        return {
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            uptime: Date.now() - this.startTime,
            timestamp: new Date().toISOString(),
        }
    }

    getPrometheusFormat(): string {
        const metrics = this.getMetrics()
        return `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.requestCount}

# HELP http_errors_total Total number of HTTP errors
# TYPE http_errors_total counter
http_errors_total ${metrics.errorCount}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${(metrics.uptime / 1000).toFixed(2)}
`
    }

    reset(): void {
        this.requestCount = 0
        this.errorCount = 0
        this.startTime = Date.now()
    }
}

// Singleton instance
export const metricsCollector = new MetricsCollector()

/**
 * Middleware to track request metrics
 */
export const metricsMiddleware = (
    req: Request,
    res: Response,
    next: Function
) => {
    metricsCollector.incrementRequests()

    // Track errors
    const originalEnd = res.end
    res.end = function (this: Response, ...args: any[]): Response {
        if (res.statusCode >= 400) {
            metricsCollector.incrementErrors()
        }
        return originalEnd.apply(this, args)
    }

    next()
}

/**
 * Metrics endpoint handler
 */
export const metricsHandler = (req: Request, res: Response) => {
    const format = req.query.format as string

    if (format === "prometheus") {
        res.setHeader("Content-Type", "text/plain; version=0.0.4")
        res.send(metricsCollector.getPrometheusFormat())
    } else {
        res.json(metricsCollector.getMetrics())
    }
}
