import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { TimePeriodSelector } from "./TimePeriodSelector"

describe("TimePeriodSelector", () => {
    it("renders all time period options", () => {
        const mockOnChange = vi.fn()
        render(
            <TimePeriodSelector
                selectedPeriod="7d"
                onPeriodChange={mockOnChange}
            />
        )

        expect(screen.getByText("Last 7 days")).toBeInTheDocument()
        expect(screen.getByText("Last 30 days")).toBeInTheDocument()
        expect(screen.getByText("Last 90 days")).toBeInTheDocument()
    })

    it("highlights the selected period", () => {
        const mockOnChange = vi.fn()
        render(
            <TimePeriodSelector
                selectedPeriod="30d"
                onPeriodChange={mockOnChange}
            />
        )

        const thirtyDaysButton = screen.getByText("Last 30 days")
        expect(thirtyDaysButton).toHaveClass("bg-blue-600")
    })

    it("calls onPeriodChange when a period is clicked", async () => {
        const user = userEvent.setup()
        const mockOnChange = vi.fn()
        render(
            <TimePeriodSelector
                selectedPeriod="7d"
                onPeriodChange={mockOnChange}
            />
        )

        const ninetyDaysButton = screen.getByText("Last 90 days")
        await user.click(ninetyDaysButton)

        expect(mockOnChange).toHaveBeenCalledWith("90d")
    })

    it("displays the time period label", () => {
        const mockOnChange = vi.fn()
        render(
            <TimePeriodSelector
                selectedPeriod="7d"
                onPeriodChange={mockOnChange}
            />
        )

        expect(screen.getByText("Time Period:")).toBeInTheDocument()
    })
})
