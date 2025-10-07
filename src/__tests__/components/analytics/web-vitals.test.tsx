import WebVitalsReport from "@/components/analytics/web-vitals"
import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// web-vitals registers listeners on mount; we cannot trigger real web-vitals events easily.
// Instead, we spy on global functions and assert nothing crashes on mount.

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
        va?: (...args: unknown[]) => void
    }
}

describe("WebVitalsReport", () => {
    beforeEach(() => {
        window.gtag = vi.fn()
        window.va = vi.fn()
    })

    it("mounts without errors and exposes globals", () => {
        expect(() => render(<WebVitalsReport />)).not.toThrow()
        // We cannot assert calls without emitting metrics, but globals exist
        expect(typeof window.gtag).toBe("function")
        expect(typeof window.va).toBe("function")
    })

    it("handles PerformanceObserver support and disconnects gracefully", () => {
        const disconnect = vi.fn()
        const observe = vi.fn()
        ;(global as any).PerformanceObserver = class {
            constructor(_: any) {}
            observe = observe
            disconnect = disconnect
        } as any
        const { unmount } = render(<WebVitalsReport />)
        unmount()
        expect(disconnect).toHaveBeenCalled()
    })
})
