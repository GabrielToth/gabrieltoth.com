import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { Metric, SocialChannel } from "./ChannelComparison"
import { ChannelComparison } from "./ChannelComparison"

describe("ChannelComparison", () => {
    const mockChannels: SocialChannel[] = [
        {
            id: "ch1",
            platform: "facebook",
            accountId: "123",
            accountName: "My Facebook",
            isConnected: true,
        },
        {
            id: "ch2",
            platform: "instagram",
            accountId: "456",
            accountName: "My Instagram",
            isConnected: true,
        },
    ]

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

    it("renders channel comparison title", () => {
        render(
            <ChannelComparison
                channels={mockChannels}
                selectedChannels={[]}
                metrics={mockMetrics}
                onChannelSelectionChange={vi.fn()}
            />
        )
        expect(screen.getByText("Channel Comparison")).toBeInTheDocument()
    })

    it("renders channel selection checkboxes", () => {
        render(
            <ChannelComparison
                channels={mockChannels}
                selectedChannels={[]}
                metrics={mockMetrics}
                onChannelSelectionChange={vi.fn()}
            />
        )
        expect(screen.getByText("My Facebook")).toBeInTheDocument()
        expect(screen.getByText("My Instagram")).toBeInTheDocument()
    })

    it("calls onChannelSelectionChange when checkbox is clicked", async () => {
        const user = userEvent.setup()
        const mockOnChange = vi.fn()
        render(
            <ChannelComparison
                channels={mockChannels}
                selectedChannels={[]}
                metrics={mockMetrics}
                onChannelSelectionChange={mockOnChange}
            />
        )

        const checkboxes = screen.getAllByRole("checkbox")
        await user.click(checkboxes[0])

        expect(mockOnChange).toHaveBeenCalled()
    })

    it("renders comparison table when channels are selected", () => {
        render(
            <ChannelComparison
                channels={mockChannels}
                selectedChannels={["ch1", "ch2"]}
                metrics={mockMetrics}
                onChannelSelectionChange={vi.fn()}
            />
        )
        expect(screen.getByText("Metrics Comparison")).toBeInTheDocument()
        expect(screen.getByText("Metric")).toBeInTheDocument()
        expect(screen.getByText("Highest")).toBeInTheDocument()
    })

    it("renders loading skeleton when isLoading is true", () => {
        render(
            <ChannelComparison
                channels={mockChannels}
                selectedChannels={[]}
                metrics={[]}
                onChannelSelectionChange={vi.fn()}
                isLoading={true}
            />
        )
        const skeletons = screen.getAllByRole("generic")
        expect(skeletons.length).toBeGreaterThan(0)
    })

    it("renders error message when error is provided", () => {
        const errorMessage = "Failed to load comparison"
        render(
            <ChannelComparison
                channels={mockChannels}
                selectedChannels={[]}
                metrics={[]}
                onChannelSelectionChange={vi.fn()}
                error={errorMessage}
                onRetry={vi.fn()}
            />
        )
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it("renders empty state when no channels", () => {
        render(
            <ChannelComparison
                channels={[]}
                selectedChannels={[]}
                metrics={mockMetrics}
                onChannelSelectionChange={vi.fn()}
            />
        )
        expect(
            screen.getByText(/No channels available for comparison/)
        ).toBeInTheDocument()
    })

    it("renders empty comparison state when no channels selected", () => {
        render(
            <ChannelComparison
                channels={mockChannels}
                selectedChannels={[]}
                metrics={mockMetrics}
                onChannelSelectionChange={vi.fn()}
            />
        )
        expect(
            screen.getByText(/Select channels above to see comparison data/)
        ).toBeInTheDocument()
    })

    it("displays metric names in comparison table", () => {
        render(
            <ChannelComparison
                channels={mockChannels}
                selectedChannels={["ch1", "ch2"]}
                metrics={mockMetrics}
                onChannelSelectionChange={vi.fn()}
            />
        )
        expect(screen.getByText("Followers")).toBeInTheDocument()
        expect(screen.getByText("Engagement")).toBeInTheDocument()
    })
})
