import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { Metric } from "./MetricCard"
import { MetricCard } from "./MetricCard"

describe("MetricCard", () => {
    const mockMetric: Metric = {
        id: "followers",
        name: "Followers",
        value: 12500,
        change: 250,
        changePercent: 2.04,
        icon: "users",
    }

    it("renders metric name", () => {
        render(<MetricCard metric={mockMetric} />)
        expect(screen.getByText("Followers")).toBeInTheDocument()
    })

    it("renders metric value", () => {
        render(<MetricCard metric={mockMetric} />)
        // Check for the value (may be formatted differently based on locale)
        expect(screen.getByText(/12[.,]500/)).toBeInTheDocument()
    })

    it("renders positive change with green styling", () => {
        render(<MetricCard metric={mockMetric} />)
        const changeElement = screen.getByText(/\+250/)
        expect(changeElement).toHaveClass("text-green-600")
    })

    it("renders change percentage", () => {
        render(<MetricCard metric={mockMetric} />)
        expect(screen.getByText(/2\.04/)).toBeInTheDocument()
    })

    it("renders negative change with red styling", () => {
        const negativeMetric: Metric = {
            ...mockMetric,
            change: -100,
            changePercent: -0.8,
        }
        render(<MetricCard metric={negativeMetric} />)
        const changeElement = screen.getByText(/-100/)
        expect(changeElement).toHaveClass("text-red-600")
    })

    it("renders zero change", () => {
        const zeroMetric: Metric = {
            ...mockMetric,
            change: 0,
            changePercent: 0,
        }
        render(<MetricCard metric={zeroMetric} />)
        expect(screen.getByText(/\+0/)).toBeInTheDocument()
    })

    it("formats large numbers with separators", () => {
        const largeMetric: Metric = {
            ...mockMetric,
            value: 1000000,
            change: 50000,
        }
        render(<MetricCard metric={largeMetric} />)
        // Check for large number (may be formatted differently based on locale)
        expect(screen.getByText(/1[.,]000[.,]000/)).toBeInTheDocument()
        expect(screen.getByText(/\+50[.,]000/)).toBeInTheDocument()
    })
})
