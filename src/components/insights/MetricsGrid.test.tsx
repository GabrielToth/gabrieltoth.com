import { screen } from "@testing-library/react"
import { renderInsights } from "@/test-utils/insights-render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { Metric } from "./MetricsGrid"
import { MetricsGrid } from "./MetricsGrid"

describe("MetricsGrid", () => {
    const mockMetrics: Metric[] = [
        {
            id: "followers",
            name: "Followers",
            value: 12500,
            change: 250,
            changePercent: 2.04,
            icon: "users",
        },
        {
            id: "engagement",
            name: "Engagement",
            value: 3450,
            change: 120,
            changePercent: 3.6,
            icon: "heart",
        },
    ]

    it("renders metric cards", () => {
        renderInsights(<MetricsGrid metrics={mockMetrics} />)
        expect(screen.getByText("Followers")).toBeInTheDocument()
        expect(screen.getByText("Engagement")).toBeInTheDocument()
    })

    it("renders loading skeleton when isLoading is true", () => {
        renderInsights(<MetricsGrid metrics={[]} isLoading={true} />)
        const skeletons = screen.getAllByRole("generic")
        expect(skeletons.length).toBeGreaterThan(0)
    })

    it("renders error message when error is provided", () => {
        const errorMessage = "Failed to load metrics"
        renderInsights(
            <MetricsGrid metrics={[]} error={errorMessage} onRetry={vi.fn()} />
        )
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it("renders retry button when error and onRetry are provided", () => {
        const mockRetry = vi.fn()
        renderInsights(
            <MetricsGrid
                metrics={[]}
                error="Failed to load"
                onRetry={mockRetry}
            />
        )
        expect(screen.getByText("Retry")).toBeInTheDocument()
    })

    it("calls onRetry when retry button is clicked", async () => {
        const user = userEvent.setup()
        const mockRetry = vi.fn()
        renderInsights(
            <MetricsGrid
                metrics={[]}
                error="Failed to load"
                onRetry={mockRetry}
            />
        )

        const retryButton = screen.getByText("Retry")
        await user.click(retryButton)

        expect(mockRetry).toHaveBeenCalled()
    })

    it("renders empty state when no metrics", () => {
        renderInsights(<MetricsGrid metrics={[]} />)
        expect(screen.getByText(/No metrics available/)).toBeInTheDocument()
    })

    it("renders all metrics in a grid", () => {
        renderInsights(<MetricsGrid metrics={mockMetrics} />)
        // Check that both metrics are rendered
        expect(screen.getByText("Followers")).toBeInTheDocument()
        expect(screen.getByText("Engagement")).toBeInTheDocument()
        // Check for metric values (may be formatted differently based on locale)
        expect(screen.getByText(/12[.,]500/)).toBeInTheDocument()
        expect(screen.getByText(/3[.,]450/)).toBeInTheDocument()
    })
})
