import NetworkSelector from "@/components/publish/NetworkSelector"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const mockNetworks = [
    { id: "1", platform: "youtube", status: "connected" as const },
    { id: "2", platform: "facebook", status: "connected" as const },
    { id: "3", platform: "twitter", status: "expired" as const },
]

const mockGroups = [{ id: "g1", name: "Social Media", networkIds: ["1", "2"] }]

describe("NetworkSelector", () => {
    it("renders all networks", () => {
        render(
            <NetworkSelector
                networks={mockNetworks}
                groups={mockGroups}
                selectedNetworkIds={[]}
                onNetworkToggle={vi.fn()}
                onGroupToggle={vi.fn()}
                onSelectAll={vi.fn()}
                onDeselectAll={vi.fn()}
            />
        )
        expect(screen.getByText("youtube")).toBeInTheDocument()
        expect(screen.getByText("facebook")).toBeInTheDocument()
    })

    it("displays network status badges", () => {
        render(
            <NetworkSelector
                networks={mockNetworks}
                groups={mockGroups}
                selectedNetworkIds={[]}
                onNetworkToggle={vi.fn()}
                onGroupToggle={vi.fn()}
                onSelectAll={vi.fn()}
                onDeselectAll={vi.fn()}
            />
        )
        expect(screen.getAllByText("Connected")).toHaveLength(2)
        expect(screen.getByText("Expired")).toBeInTheDocument()
    })

    it("calls onNetworkToggle when network is clicked", () => {
        const onNetworkToggle = vi.fn()
        render(
            <NetworkSelector
                networks={mockNetworks}
                groups={mockGroups}
                selectedNetworkIds={[]}
                onNetworkToggle={onNetworkToggle}
                onGroupToggle={vi.fn()}
                onSelectAll={vi.fn()}
                onDeselectAll={vi.fn()}
            />
        )
        const checkbox = screen.getAllByRole("checkbox")[1] // First is group
        fireEvent.click(checkbox)
        expect(onNetworkToggle).toHaveBeenCalled()
    })

    it("filters networks by search term", () => {
        render(
            <NetworkSelector
                networks={mockNetworks}
                groups={mockGroups}
                selectedNetworkIds={[]}
                onNetworkToggle={vi.fn()}
                onGroupToggle={vi.fn()}
                onSelectAll={vi.fn()}
                onDeselectAll={vi.fn()}
            />
        )
        const searchInput = screen.getByPlaceholderText(/Search networks/)
        fireEvent.change(searchInput, { target: { value: "youtube" } })
        expect(screen.getByText("youtube")).toBeInTheDocument()
    })

    it("displays selected count", () => {
        render(
            <NetworkSelector
                networks={mockNetworks}
                groups={mockGroups}
                selectedNetworkIds={["1", "2"]}
                onNetworkToggle={vi.fn()}
                onGroupToggle={vi.fn()}
                onSelectAll={vi.fn()}
                onDeselectAll={vi.fn()}
            />
        )
        expect(screen.getByText(/2 of 3 selected/)).toBeInTheDocument()
    })

    it("calls onSelectAll when Select All is clicked", () => {
        const onSelectAll = vi.fn()
        render(
            <NetworkSelector
                networks={mockNetworks}
                groups={mockGroups}
                selectedNetworkIds={[]}
                onNetworkToggle={vi.fn()}
                onGroupToggle={vi.fn()}
                onSelectAll={onSelectAll}
                onDeselectAll={vi.fn()}
            />
        )
        fireEvent.click(screen.getByText("Select All"))
        expect(onSelectAll).toHaveBeenCalled()
    })
})
