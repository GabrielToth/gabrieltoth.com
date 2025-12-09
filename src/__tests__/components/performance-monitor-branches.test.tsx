import { act, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("components/analytics/performance-monitor branches", () => {
    beforeEach(() => {
        // Mock performance entries for initial update
        ;(global as any).performance = {
            getEntriesByType: vi.fn().mockReturnValue([
                { entryType: "resource", transferSize: 2048 },
                { entryType: "resource", transferSize: 1024 },
            ]),
        }
    })

    const dispatchVital = (name: string, value: number) => {
        const event = new CustomEvent("web-vital", {
            detail: { name, value, id: `${name}-1` },
        } as any)
        window.dispatchEvent(event)
    }

    it("toggles panel and colors metrics across thresholds", async () => {
        const { default: PerformanceMonitor } =
            await import("@/components/analytics/performance-monitor")
        render(<PerformanceMonitor enabled={true} />)

        // Open panel
        const toggle = screen.getByTitle(/performance monitor/i)
        fireEvent.click(toggle)

        // Good LCP (green)
        await act(async () => {
            dispatchVital("LCP", 2000)
        })
        const lcpGood = await screen.findByText(/2000ms/)
        expect(lcpGood).toHaveClass("text-green-500")

        // Needs-improvement LCP (yellow)
        await act(async () => {
            dispatchVital("LCP", 3000)
        })
        const lcpMid = await screen.findByText(/3000ms/)
        expect(lcpMid).toHaveClass("text-yellow-500")

        // Poor LCP (red)
        await act(async () => {
            dispatchVital("LCP", 5000)
        })
        const lcpPoor = await screen.findByText(/5000ms/)
        expect(lcpPoor).toHaveClass("text-red-500")

        // Resource metrics shown with KB and Count
        expect(screen.getByText(/count:/i)).toBeInTheDocument()
        expect(screen.getByText(/size:/i)).toBeInTheDocument()
        expect(screen.getByText(/KB/i)).toBeInTheDocument()
    })
})
