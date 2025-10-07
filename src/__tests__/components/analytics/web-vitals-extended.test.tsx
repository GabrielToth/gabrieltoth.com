import WebVitalsReport from "@/components/analytics/web-vitals"
import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock web-vitals to immediately invoke handlers with fake metrics
vi.mock("web-vitals", () => {
    return {
        onCLS: (cb: any) => {
            cb({ name: "CLS", value: 0.05, id: "cls-1" })
            // Trigger fallback thresholds path (unknown metric name)
            cb({ name: "UNKNOWN", value: 9999, id: "u-1" })
        },
        onFCP: (cb: any) => cb({ name: "FCP", value: 1500, id: "fcp-1" }),
        onLCP: (cb: any) => {
            cb({ name: "LCP", value: 3000, id: "lcp-1" }) // needs-improvement
            cb({ name: "LCP", value: 5000, id: "lcp-2" }) // poor
        },
        onTTFB: (cb: any) => {
            cb({ name: "TTFB", value: 900, id: "ttfb-1" }) // needs-improvement
            cb({ name: "TTFB", value: 2500, id: "ttfb-2" }) // poor
        },
    }
})

declare global {
    // eslint-disable-next-line no-var
    var PerformanceObserver: any
}

describe("WebVitalsReport extended", () => {
    beforeEach(() => {
        // Ensure analytics globals exist
        ;(window as any).gtag = vi.fn()
        ;(window as any).va = vi.fn()
    })

    it("sends metrics to analytics and logs in development", () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
        const oldEnv = process.env.NODE_ENV
        process.env.NODE_ENV = "development"

        render(<WebVitalsReport />)

        expect(window.gtag).toHaveBeenCalled()
        expect(window.va).toHaveBeenCalled()
        expect(logSpy).toHaveBeenCalled()

        process.env.NODE_ENV = oldEnv
        logSpy.mockRestore()
    })

    it("observes navigation and resource entries and disconnects", () => {
        const disconnect = vi.fn()
        const observers: Array<(list: any) => void> = []
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
        const oldEnv = process.env.NODE_ENV
        process.env.NODE_ENV = "development"

        class PO {
            cb: (list: any) => void
            constructor(cb: (list: any) => void) {
                this.cb = cb
                observers.push(cb)
            }
            observe() {}
            disconnect = disconnect
        }

        ;(global as any).PerformanceObserver = PO

        const { unmount } = render(<WebVitalsReport />)

        // Simulate navigation entry
        observers[0]({
            getEntries: () => [
                {
                    entryType: "navigation",
                    domContentLoadedEventEnd: 20,
                    domContentLoadedEventStart: 10,
                    loadEventEnd: 40,
                    loadEventStart: 30,
                    domInteractive: 25,
                    domComplete: 45,
                    fetchStart: 0,
                },
            ],
        })

        // Simulate resource entry with slow duration
        observers[1]({
            getEntries: () => [
                {
                    entryType: "resource",
                    name: "https://cdn.example.com/asset.js",
                    duration: 1500,
                    transferSize: 1024,
                },
            ],
        })

        unmount()
        expect(disconnect).toHaveBeenCalledTimes(2)
        expect(logSpy).toHaveBeenCalled()
        expect(warnSpy).toHaveBeenCalled()

        process.env.NODE_ENV = oldEnv
        warnSpy.mockRestore()
        logSpy.mockRestore()
    })

    it("handles observer.observe failure gracefully", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

        class POThrow {
            constructor(_: any) {}
            observe() {
                throw new Error("observe not supported")
            }
            disconnect() {}
        }
        ;(global as any).PerformanceObserver = POThrow

        expect(() => render(<WebVitalsReport />)).not.toThrow()
        expect(warnSpy).toHaveBeenCalled()
        warnSpy.mockRestore()
    })
})
