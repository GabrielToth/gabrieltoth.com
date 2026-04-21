import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { DashboardLayout } from "./DashboardLayout"

describe("DashboardLayout", () => {
    it("renders children content", () => {
        render(
            <DashboardLayout activeTab="publish">
                <div>Test Content</div>
            </DashboardLayout>
        )
        expect(screen.getByText("Test Content")).toBeInTheDocument()
    })

    it("renders sidebar", () => {
        render(
            <DashboardLayout activeTab="publish">
                <div>Content</div>
            </DashboardLayout>
        )
        const dashboardTexts = screen.getAllByText("Dashboard")
        expect(dashboardTexts.length).toBeGreaterThan(0)
    })

    it("displays hamburger menu on mobile", () => {
        render(
            <DashboardLayout activeTab="publish">
                <div>Content</div>
            </DashboardLayout>
        )
        const hamburger = screen.getByLabelText("Toggle sidebar")
        expect(hamburger).toBeInTheDocument()
    })

    it("toggles sidebar when hamburger is clicked", () => {
        render(
            <DashboardLayout activeTab="publish">
                <div>Content</div>
            </DashboardLayout>
        )
        const hamburger = screen.getByLabelText("Toggle sidebar")
        fireEvent.click(hamburger)
        expect(hamburger).toHaveAttribute("aria-expanded", "true")
    })

    it("calls onTabChange when tab is changed", () => {
        const onTabChange = vi.fn()
        render(
            <DashboardLayout activeTab="publish" onTabChange={onTabChange}>
                <div>Content</div>
            </DashboardLayout>
        )
        const insightsButtons = screen.getAllByRole("button", {
            name: /insights/i,
        })
        fireEvent.click(insightsButtons[0])
        expect(onTabChange).toHaveBeenCalledWith("insights")
    })

    it("closes sidebar when overlay is clicked", () => {
        const { container } = render(
            <DashboardLayout activeTab="publish">
                <div>Content</div>
            </DashboardLayout>
        )
        const hamburger = screen.getByLabelText("Toggle sidebar")
        fireEvent.click(hamburger)
        const overlay = container.querySelector('[aria-hidden="true"]')
        if (overlay) {
            fireEvent.click(overlay)
            expect(hamburger).toHaveAttribute("aria-expanded", "false")
        }
    })

    it("highlights active tab", () => {
        render(
            <DashboardLayout activeTab="insights">
                <div>Content</div>
            </DashboardLayout>
        )
        const insightsButtons = screen.getAllByRole("button", {
            name: /insights/i,
        })
        const activeButton = insightsButtons.find(btn =>
            btn.hasAttribute("aria-current")
        )
        expect(activeButton).toHaveAttribute("aria-current", "page")
    })

    it("renders all navigation items", () => {
        render(
            <DashboardLayout activeTab="publish">
                <div>Content</div>
            </DashboardLayout>
        )
        const publishButtons = screen.getAllByRole("button", {
            name: /publish/i,
        })
        const insightsButtons = screen.getAllByRole("button", {
            name: /insights/i,
        })
        const settingsButtons = screen.getAllByRole("button", {
            name: /settings/i,
        })
        expect(publishButtons.length).toBeGreaterThan(0)
        expect(insightsButtons.length).toBeGreaterThan(0)
        expect(settingsButtons.length).toBeGreaterThan(0)
    })
})
