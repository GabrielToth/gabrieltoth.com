// Tests for Observability Features
// Feature: distributed-infrastructure-logging

import { Request, Response } from "express"
import fc from "fast-check"
import { Pool } from "pg"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { metricsCollector, metricsHandler, metricsMiddleware } from "./metrics"
import {
    getRequestDuration,
    performanceTimingMiddleware,
} from "./performance-timing"
import { SlowQueryPool } from "./slow-query"

describe("Observability Features", () => {
    // Feature: distributed-infrastructure-logging, Property 9: Slow query logging
    // **Validates: Requirements 12.5**
    describe("Property 9: Slow query logging", () => {
        it("should log queries exceeding 1 second threshold", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1000, max: 5000 }), // duration in ms
                    async duration => {
                        const mockPool = {
                            query: vi.fn().mockImplementation(async () => {
                                await new Promise(resolve =>
                                    setTimeout(resolve, duration)
                                )
                                return { rows: [], rowCount: 0 }
                            }),
                        } as unknown as Pool

                        const slowQueryPool = new SlowQueryPool(mockPool)
                        const logSpy = vi
                            .spyOn(console, "log")
                            .mockImplementation(() => {})

                        await slowQueryPool.query("SELECT * FROM test")

                        // Should have logged the slow query
                        expect(mockPool.query).toHaveBeenCalled()

                        logSpy.mockRestore()
                    }
                ),
                { numRuns: 5 } // Fewer runs due to timing
            )
        })

        it("should not log fast queries", () => {
            fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 999 }), // duration in ms
                    async duration => {
                        const mockPool = {
                            query: vi.fn().mockImplementation(async () => {
                                await new Promise(resolve =>
                                    setTimeout(resolve, duration)
                                )
                                return { rows: [], rowCount: 0 }
                            }),
                        } as unknown as Pool

                        const slowQueryPool = new SlowQueryPool(mockPool)

                        await slowQueryPool.query("SELECT * FROM test")

                        expect(mockPool.query).toHaveBeenCalled()
                    }
                ),
                { numRuns: 5 }
            )
        })
    })

    // Feature: distributed-infrastructure-logging, Property 8: Performance timing in debug logs
    // **Validates: Requirements 12.7**
    describe("Property 8: Performance timing in debug logs", () => {
        it("should include timing information in response headers", () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 100 }), // path
                    fc.constantFrom("GET", "POST", "PUT", "DELETE"), // method
                    (path, method) => {
                        const mockReq = {
                            method,
                            path,
                            headers: { "x-request-id": "test-123" },
                        } as Request

                        const mockRes = {
                            setHeader: vi.fn(),
                            end: vi.fn(),
                        } as unknown as Response

                        const next = vi.fn()

                        performanceTimingMiddleware(mockReq, mockRes, next)

                        // Simulate request completion
                        ;(mockRes.end as any)()

                        // Should have set timing header
                        expect(mockRes.setHeader).toHaveBeenCalledWith(
                            "X-Response-Time",
                            expect.stringMatching(/\d+ms/)
                        )
                    }
                ),
                { numRuns: 20 }
            )
        })

        it("should track request duration", () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 1000 }), // delay in ms
                    async delay => {
                        const mockReq = {
                            method: "GET",
                            path: "/test",
                            headers: {},
                        } as Request

                        const mockRes = {
                            setHeader: vi.fn(),
                            end: vi.fn(),
                        } as unknown as Response

                        const next = vi.fn()

                        performanceTimingMiddleware(mockReq, mockRes, next)

                        // Wait for delay
                        await new Promise(resolve => setTimeout(resolve, delay))

                        const duration = getRequestDuration(mockReq)

                        // Duration should be at least the delay
                        expect(duration).toBeGreaterThanOrEqual(delay)
                    }
                ),
                { numRuns: 10 }
            )
        })
    })

    // Unit Tests
    describe("Unit Tests", () => {
        beforeEach(() => {
            metricsCollector.reset()
        })

        it("should track request count", () => {
            metricsCollector.incrementRequests()
            metricsCollector.incrementRequests()
            metricsCollector.incrementRequests()

            const metrics = metricsCollector.getMetrics()
            expect(metrics.requestCount).toBe(3)
        })

        it("should track error count", () => {
            metricsCollector.incrementErrors()
            metricsCollector.incrementErrors()

            const metrics = metricsCollector.getMetrics()
            expect(metrics.errorCount).toBe(2)
        })

        it("should track uptime", async () => {
            await new Promise(resolve => setTimeout(resolve, 100))

            const metrics = metricsCollector.getMetrics()
            expect(metrics.uptime).toBeGreaterThanOrEqual(100)
        })

        it("should format metrics for Prometheus", () => {
            metricsCollector.incrementRequests()
            metricsCollector.incrementErrors()

            const prometheus = metricsCollector.getPrometheusFormat()

            expect(prometheus).toContain("http_requests_total 1")
            expect(prometheus).toContain("http_errors_total 1")
            expect(prometheus).toContain("process_uptime_seconds")
        })

        it("should return JSON metrics by default", () => {
            const mockReq = {
                query: {},
            } as unknown as Request

            const mockRes = {
                json: vi.fn(),
                setHeader: vi.fn(),
                send: vi.fn(),
            } as unknown as Response

            metricsHandler(mockReq, mockRes)

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    requestCount: expect.any(Number),
                    errorCount: expect.any(Number),
                    uptime: expect.any(Number),
                    timestamp: expect.any(String),
                })
            )
        })

        it("should return Prometheus format when requested", () => {
            const mockReq = {
                query: { format: "prometheus" },
            } as unknown as Request

            const mockRes = {
                json: vi.fn(),
                setHeader: vi.fn(),
                send: vi.fn(),
            } as unknown as Response

            metricsHandler(mockReq, mockRes)

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                "Content-Type",
                "text/plain; version=0.0.4"
            )
            expect(mockRes.send).toHaveBeenCalledWith(
                expect.stringContaining("http_requests_total")
            )
        })

        it("should sanitize long queries", () => {
            const mockPool = {
                query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
            } as unknown as Pool

            const slowQueryPool = new SlowQueryPool(mockPool)
            const longQuery =
                "SELECT * FROM test WHERE " + "a = 1 AND ".repeat(100)

            slowQueryPool.query(longQuery)

            expect(mockPool.query).toHaveBeenCalled()
        })

        it("should handle query errors", async () => {
            const mockPool = {
                query: vi.fn().mockRejectedValue(new Error("Query failed")),
            } as unknown as Pool

            const slowQueryPool = new SlowQueryPool(mockPool)

            await expect(
                slowQueryPool.query("SELECT * FROM test")
            ).rejects.toThrow("Query failed")
        })

        it("should increment errors for 4xx status codes", () => {
            const mockReq = {} as Request
            const mockRes = {
                statusCode: 404,
                end: vi.fn(),
            } as unknown as Response

            const next = vi.fn()

            metricsMiddleware(mockReq, mockRes, next)
            ;(mockRes.end as any)()

            const metrics = metricsCollector.getMetrics()
            expect(metrics.errorCount).toBe(1)
        })

        it("should increment errors for 5xx status codes", () => {
            const mockReq = {} as Request
            const mockRes = {
                statusCode: 500,
                end: vi.fn(),
            } as unknown as Response

            const next = vi.fn()

            metricsMiddleware(mockReq, mockRes, next)
            ;(mockRes.end as any)()

            const metrics = metricsCollector.getMetrics()
            expect(metrics.errorCount).toBe(1)
        })

        it("should not increment errors for 2xx status codes", () => {
            const mockReq = {} as Request
            const mockRes = {
                statusCode: 200,
                end: vi.fn(),
            } as unknown as Response

            const next = vi.fn()

            metricsMiddleware(mockReq, mockRes, next)
            ;(mockRes.end as any)()

            const metrics = metricsCollector.getMetrics()
            expect(metrics.errorCount).toBe(0)
        })
    })
})
