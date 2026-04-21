import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { GraphData, SocialChannel } from "./ChannelGraphs"
import { ChannelGraphs } from "./ChannelGraphs"

describe("ChannelGraphs", () => {
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

    const mockGraphData: GraphData[] = [
        {
            date: "2024-01-01",
            followers: 10000,
            engagement: 500,
            reach: 50000,
            impressions: 100000,
            channel: "ch1",
        },
        {
            date: "2024-01-02",
            followers: 10100,
            engagement: 520,
            reach: 51000,
            impressions: 102000,
            channel: "ch1",
        },
        {
            date: "2024-01-01",
            followers: 5000,
            engagement: 300,
            reach: 30000,
            impressions: 60000,
            channel: "ch2",
        },
    ]

    it("renders channel graphs", () => {
        render(<ChannelGraphs channels={mockChannels} data={mockGraphData} />)
        expect(screen.getByText("My Facebook (facebook)")).toBeInTheDocument()
        expect(screen.getByText("My Instagram (instagram)")).toBeInTheDocument()
    })

    it("renders loading skeleton when isLoading is true", () => {
        render(
            <ChannelGraphs channels={mockChannels} data={[]} isLoading={true} />
        )
        const skeletons = screen.getAllByRole("generic")
        expect(skeletons.length).toBeGreaterThan(0)
    })

    it("renders error message when error is provided", () => {
        const errorMessage = "Failed to load graphs"
        render(
            <ChannelGraphs
                channels={mockChannels}
                data={[]}
                error={errorMessage}
                onRetry={vi.fn()}
            />
        )
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it("renders retry button when error and onRetry are provided", () => {
        const mockRetry = vi.fn()
        render(
            <ChannelGraphs
                channels={mockChannels}
                data={[]}
                error="Failed to load"
                onRetry={mockRetry}
            />
        )
        expect(screen.getByText("Retry")).toBeInTheDocument()
    })

    it("calls onRetry when retry button is clicked", async () => {
        const user = userEvent.setup()
        const mockRetry = vi.fn()
        render(
            <ChannelGraphs
                channels={mockChannels}
                data={[]}
                error="Failed to load"
                onRetry={mockRetry}
            />
        )

        const retryButton = screen.getByText("Retry")
        await user.click(retryButton)

        expect(mockRetry).toHaveBeenCalled()
    })

    it("renders empty state when no channels", () => {
        render(<ChannelGraphs channels={[]} data={mockGraphData} />)
        expect(screen.getByText(/No graph data available/)).toBeInTheDocument()
    })

    it("renders data table with metrics", () => {
        render(<ChannelGraphs channels={mockChannels} data={mockGraphData} />)
        // Check for table headers (may appear multiple times for multiple channels)
        expect(screen.getAllByText("Date").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Followers").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Engagement").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Reach").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Impressions").length).toBeGreaterThan(0)
    })

    it("displays average statistics for each channel", () => {
        render(<ChannelGraphs channels={mockChannels} data={mockGraphData} />)
        // Check for average statistics (may appear multiple times for multiple channels)
        expect(screen.getAllByText("Avg Followers").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Avg Engagement").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Avg Reach").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Avg Impressions").length).toBeGreaterThan(0)
    })
})
