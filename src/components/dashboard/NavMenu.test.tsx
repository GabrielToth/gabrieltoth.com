import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { NavMenu, type NavItem } from "./NavMenu"

describe("NavMenu", () => {
    const mockItems: NavItem[] = [
        { id: "publish", label: "Publish", icon: "📝" },
        { id: "insights", label: "Insights", icon: "📊" },
        { id: "settings", label: "Settings", icon: "⚙️" },
    ]

    it("renders all navigation items", () => {
        const onItemClick = vi.fn()
        render(
            <NavMenu
                items={mockItems}
                activeItem="publish"
                onItemClick={onItemClick}
            />
        )

        expect(
            screen.getByRole("button", { name: /publish/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: /insights/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: /settings/i })
        ).toBeInTheDocument()
    })

    it("highlights the active item", () => {
        const onItemClick = vi.fn()
        render(
            <NavMenu
                items={mockItems}
                activeItem="insights"
                onItemClick={onItemClick}
            />
        )

        const insightsButton = screen.getByRole("button", { name: /insights/i })
        expect(insightsButton).toHaveAttribute("aria-current", "page")
        expect(insightsButton).toHaveClass("bg-blue-50", "text-blue-600")
    })

    it("does not highlight inactive items", () => {
        const onItemClick = vi.fn()
        render(
            <NavMenu
                items={mockItems}
                activeItem="publish"
                onItemClick={onItemClick}
            />
        )

        const insightsButton = screen.getByRole("button", { name: /insights/i })
        expect(insightsButton).not.toHaveAttribute("aria-current")
        expect(insightsButton).toHaveClass("text-gray-700")
    })

    it("calls onItemClick when an item is clicked", () => {
        const onItemClick = vi.fn()
        render(
            <NavMenu
                items={mockItems}
                activeItem="publish"
                onItemClick={onItemClick}
            />
        )

        const settingsButton = screen.getByRole("button", { name: /settings/i })
        fireEvent.click(settingsButton)

        expect(onItemClick).toHaveBeenCalledWith("settings")
    })

    it("renders items without icons", () => {
        const itemsWithoutIcons: NavItem[] = [
            { id: "publish", label: "Publish" },
            { id: "insights", label: "Insights" },
        ]
        const onItemClick = vi.fn()

        render(
            <NavMenu
                items={itemsWithoutIcons}
                activeItem="publish"
                onItemClick={onItemClick}
            />
        )

        expect(
            screen.getByRole("button", { name: /publish/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: /insights/i })
        ).toBeInTheDocument()
    })

    it("renders items with React node icons", () => {
        const itemsWithNodeIcons: NavItem[] = [
            {
                id: "publish",
                label: "Publish",
                icon: <span data-testid="publish-icon">P</span>,
            },
            {
                id: "insights",
                label: "Insights",
                icon: <span data-testid="insights-icon">I</span>,
            },
        ]
        const onItemClick = vi.fn()

        render(
            <NavMenu
                items={itemsWithNodeIcons}
                activeItem="publish"
                onItemClick={onItemClick}
            />
        )

        expect(screen.getByTestId("publish-icon")).toBeInTheDocument()
        expect(screen.getByTestId("insights-icon")).toBeInTheDocument()
    })

    it("applies custom className", () => {
        const onItemClick = vi.fn()
        const { container } = render(
            <NavMenu
                items={mockItems}
                activeItem="publish"
                onItemClick={onItemClick}
                className="custom-class"
            />
        )

        const nav = container.querySelector("nav")
        expect(nav).toHaveClass("custom-class")
    })

    it("has proper accessibility attributes", () => {
        const onItemClick = vi.fn()
        const { container } = render(
            <NavMenu
                items={mockItems}
                activeItem="publish"
                onItemClick={onItemClick}
            />
        )

        const nav = container.querySelector("nav")
        expect(nav).toHaveAttribute("role", "navigation")
        expect(nav).toHaveAttribute("aria-label", "Main navigation")
    })

    it("handles empty items array", () => {
        const onItemClick = vi.fn()
        const { container } = render(
            <NavMenu items={[]} activeItem="" onItemClick={onItemClick} />
        )

        const buttons = container.querySelectorAll("button")
        expect(buttons.length).toBe(0)
    })

    it("handles multiple clicks on different items", () => {
        const onItemClick = vi.fn()
        render(
            <NavMenu
                items={mockItems}
                activeItem="publish"
                onItemClick={onItemClick}
            />
        )

        const publishButton = screen.getByRole("button", { name: /publish/i })
        const insightsButton = screen.getByRole("button", { name: /insights/i })

        fireEvent.click(publishButton)
        fireEvent.click(insightsButton)

        expect(onItemClick).toHaveBeenCalledTimes(2)
        expect(onItemClick).toHaveBeenNthCalledWith(1, "publish")
        expect(onItemClick).toHaveBeenNthCalledWith(2, "insights")
    })

    it("renders with focus-visible styles", () => {
        const onItemClick = vi.fn()
        render(
            <NavMenu
                items={mockItems}
                activeItem="publish"
                onItemClick={onItemClick}
            />
        )

        const publishButton = screen.getByRole("button", { name: /publish/i })
        expect(publishButton).toHaveClass("focus-visible:outline-none")
        expect(publishButton).toHaveClass("focus-visible:ring-2")
    })
})
