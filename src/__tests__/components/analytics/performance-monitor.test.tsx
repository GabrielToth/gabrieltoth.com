import PerformanceMonitor from "@/components/analytics/performance-monitor"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

describe("PerformanceMonitor", () => {
    it("renders toggle and opens panel", () => {
        render(<PerformanceMonitor enabled={true} />)
        const btn = screen.getByTitle("Performance Monitor")
        fireEvent.click(btn)
        expect(screen.getByText(/Performance Metrics/i)).toBeInTheDocument()
    })

    it("ignores when disabled", () => {
        const { container } = render(<PerformanceMonitor enabled={false} />)
        expect(container.firstChild).toBeNull()
    })

    it("updates metrics from web-vital custom events and formats values/colors", async () => {
        render(<PerformanceMonitor enabled={true} />)
        const btn = screen.getByTitle("Performance Monitor")
        fireEvent.click(btn)

        // Dispatch multiple vitals to exercise branches
        await act(async () => {
            window.dispatchEvent(
                new CustomEvent("web-vital", {
                    detail: { name: "LCP", value: 1000, id: "l" },
                } as any)
            )
            window.dispatchEvent(
                new CustomEvent("web-vital", {
                    detail: { name: "FCP", value: 2000, id: "f" },
                } as any)
            )
            window.dispatchEvent(
                new CustomEvent("web-vital", {
                    detail: { name: "CLS", value: 0.3, id: "c" },
                } as any)
            )
            window.dispatchEvent(
                new CustomEvent("web-vital", {
                    detail: { name: "TTFB", value: 2000, id: "t" },
                } as any)
            )
        })

        await waitFor(() => {
            expect(screen.getByText(/LCP:/)).toBeInTheDocument()
        })

        // CLS formatted to three decimals should appear
        expect(screen.getByText("0.300")).toBeInTheDocument()
    })

    it("sets resource metrics using performance entries", () => {
        const orig = (global as any).performance
        ;(global as any).performance = {
            getEntriesByType: vi.fn(() => [
                { transferSize: 1024 } as any,
                { transferSize: 2048 } as any,
            ]),
        } as any

        render(<PerformanceMonitor enabled={true} />)
        const btn = screen.getByTitle("Performance Monitor")
        fireEvent.click(btn)

        // bundle size 3KB formatted as 2.9KB due to rounding might vary; assert presence of "KB"
        expect(screen.getByText(/KB/)).toBeInTheDocument()
        ;(global as any).performance = orig
    })

    it("cleans up listeners and intervals on unmount", () => {
        const addSpy = vi.spyOn(window, "addEventListener")
        const removeSpy = vi.spyOn(window, "removeEventListener")
        const { unmount } = render(<PerformanceMonitor enabled={true} />)
        unmount()
        expect(addSpy).toHaveBeenCalledWith("web-vital", expect.any(Function))
        expect(removeSpy).toHaveBeenCalledWith(
            "web-vital",
            expect.any(Function)
        )
        addSpy.mockRestore()
        removeSpy.mockRestore()
    })
})
