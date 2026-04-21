import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { SocialChannel } from "./FilterBar"
import { FilterBar } from "./FilterBar"

describe("FilterBar Component", () => {
    const mockChannels: SocialChannel[] = [
        {
            id: "1",
            platform: "facebook",
            accountId: "fb123",
            accountName: "My Facebook",
            isConnected: true,
        },
        {
            id: "2",
            platform: "instagram",
            accountId: "ig123",
            accountName: "My Instagram",
            isConnected: true,
        },
        {
            id: "3",
            platform: "twitter",
            accountId: "tw123",
            accountName: "My Twitter",
            isConnected: false,
        },
    ]

    it("renders filter bar with title", () => {
        const mockOnFilterChange = vi.fn()
        render(
            <FilterBar
                channels={mockChannels}
                selectedChannels={[]}
                onFilterChange={mockOnFilterChange}
            />
        )

        expect(screen.getByText("Filter by Channel")).toBeInTheDocument()
    })

    it("renders connected channels as buttons", () => {
        const mockOnFilterChange = vi.fn()
        render(
            <FilterBar
                channels={mockChannels}
                selectedChannels={[]}
                onFilterChange={mockOnFilterChange}
            />
        )

        expect(screen.getByText("My Facebook")).toBeInTheDocument()
        expect(screen.getByText("My Instagram")).toBeInTheDocument()
    })

    it("only renders connected channels", () => {
        const mockOnFilterChange = vi.fn()
        render(
            <FilterBar
                channels={mockChannels}
                selectedChannels={[]}
                onFilterChange={mockOnFilterChange}
            />
        )

        // Connected channels should be rendered
        expect(screen.getByText("My Facebook")).toBeInTheDocument()
        expect(screen.getByText("My Instagram")).toBeInTheDocument()

        // Disconnected channels should not be rendered
        expect(screen.queryByText("My Twitter")).not.toBeInTheDocument()
    })

    it("calls onFilterChange when channel is clicked", () => {
        const mockOnFilterChange = vi.fn()
        render(
            <FilterBar
                channels={mockChannels}
                selectedChannels={[]}
                onFilterChange={mockOnFilterChange}
            />
        )

        const facebookButton = screen.getByText("My Facebook")
        fireEvent.click(facebookButton)

        expect(mockOnFilterChange).toHaveBeenCalledWith(["facebook"])
    })

    it("toggles channel selection", () => {
        const mockOnFilterChange = vi.fn()
        const { rerender } = render(
            <FilterBar
                channels={mockChannels}
                selectedChannels={[]}
                onFilterChange={mockOnFilterChange}
            />
        )

        const facebookButton = screen.getByText("My Facebook")
        fireEvent.click(facebookButton)

        expect(mockOnFilterChange).toHaveBeenCalledWith(["facebook"])

        // Rerender with selected channel
        rerender(
            <FilterBar
                channels={mockChannels}
                selectedChannels={["facebook"]}
                onFilterChange={mockOnFilterChange}
            />
        )

        fireEvent.click(facebookButton)
        expect(mockOnFilterChange).toHaveBeenCalledWith([])
    })

    it("displays selected filters count", () => {
        const mockOnFilterChange = vi.fn()
        render(
            <FilterBar
                channels={mockChannels}
                selectedChannels={["facebook", "instagram"]}
                onFilterChange={mockOnFilterChange}
            />
        )

        expect(screen.getByText("2 filters applied")).toBeInTheDocument()
    })

    it("shows clear all button when filters are selected", () => {
        const mockOnFilterChange = vi.fn()
        render(
            <FilterBar
                channels={mockChannels}
                selectedChannels={["facebook"]}
                onFilterChange={mockOnFilterChange}
            />
        )

        const clearButton = screen.getByText("Clear all filters")
        expect(clearButton).toBeInTheDocument()

        fireEvent.click(clearButton)
        expect(mockOnFilterChange).toHaveBeenCalledWith([])
    })

    it("does not show clear all button when no filters are selected", () => {
        const mockOnFilterChange = vi.fn()
        render(
            <FilterBar
                channels={mockChannels}
                selectedChannels={[]}
                onFilterChange={mockOnFilterChange}
            />
        )

        expect(screen.queryByText("Clear all filters")).not.toBeInTheDocument()
    })

    it("shows message when no connected channels", () => {
        const mockOnFilterChange = vi.fn()
        const noConnectedChannels: SocialChannel[] = [
            {
                id: "1",
                platform: "facebook",
                accountId: "fb123",
                accountName: "My Facebook",
                isConnected: false,
            },
        ]

        render(
            <FilterBar
                channels={noConnectedChannels}
                selectedChannels={[]}
                onFilterChange={mockOnFilterChange}
            />
        )

        expect(
            screen.getByText("No connected channels available")
        ).toBeInTheDocument()
    })
})
