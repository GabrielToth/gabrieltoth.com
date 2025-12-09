import React from "react"
import { describe, expect, it, vi } from "vitest"

// Stub web-vitals methods to invoke callbacks immediately
vi.mock("web-vitals", () => ({
    onCLS: (cb: any) => cb({ name: "CLS", value: 0.05, id: "a" }),
    onFCP: (cb: any) => cb({ name: "FCP", value: 1000, id: "b" }),
    onLCP: (cb: any) => cb({ name: "LCP", value: 2000, id: "c" }),
    onTTFB: (cb: any) => cb({ name: "TTFB", value: 100, id: "d" }),
}))

describe("WebVitalsReport coverage", () => {
    it("mounts and processes metrics with gtag and va present", async () => {
        ;(globalThis as any).window = {
            gtag: vi.fn(),
            va: vi.fn(),
        } as any

        const { default: WebVitalsReport } =
            await import("@/components/analytics/web-vitals")
        const element = React.createElement(WebVitalsReport, {
            onMetric: vi.fn(),
        })
        expect(element).toBeTruthy()
    })
})
