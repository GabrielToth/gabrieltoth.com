import { fetchChannels, fetchPosts } from "@/lib/api"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Post } from "./PostCard"
import type { SocialChannel } from "./PublishContainer"
import { PublishContainer } from "./PublishContainer"

// Mock the API functions
vi.mock("@/lib/api", () => ({
    fetchPosts: vi.fn(),
    fetchChannels: vi.fn(),
}))

// Mock data
const mockPosts: Post[] = [
    {
        id: "1",
        title: "First Post",
        content: "This is the first post",
        scheduledAt: new Date(Date.now() + 86400000), // 1 day in future
        status: "scheduled",
        channels: ["facebook", "instagram"],
        createdAt: new Date(),
    },
    {
        id: "2",
        title: "Published Post",
        content: "This post has been published",
        scheduledAt: new Date(Date.now() - 86400000), // 1 day ago
        publishedAt: new Date(Date.now() - 86400000),
        status: "published",
        channels: ["twitter"],
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
    },
    {
        id: "3",
        title: "Failed Post",
        content: "This post failed to publish",
        scheduledAt: new Date(Date.now() - 43200000), // 12 hours ago
        status: "failed",
        channels: ["tiktok"],
        errorMessage: "Failed to connect to TikTok API",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
    },
]

const mockChannels: SocialChannel[] = [
    {
        id: "1",
        platform: "facebook",
        accountId: "fb123",
        accountName: "My Facebook Page",
        isConnected: true,
        connectedAt: new Date(Date.now() - 86400000 * 30),
    },
    {
        id: "2",
        platform: "instagram",
        accountId: "ig123",
        accountName: "My Instagram",
        isConnected: true,
        connectedAt: new Date(Date.now() - 86400000 * 30),
    },
    {
        id: "3",
        platform: "twitter",
        accountId: "tw123",
        accountName: "My Twitter",
        isConnected: true,
        connectedAt: new Date(Date.now() - 86400000 * 30),
    },
    {
        id: "4",
        platform: "tiktok",
        accountId: "tt123",
        accountName: "My TikTok",
        isConnected: false,
    },
]

describe("PublishContainer", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Setup default mock implementations
        vi.mocked(fetchPosts).mockResolvedValue(mockPosts)
        vi.mocked(fetchChannels).mockResolvedValue(mockChannels)
    })

    it("renders the component with header", async () => {
        render(<PublishContainer />)

        expect(screen.getByText("Publish")).toBeInTheDocument()
        expect(
            screen.getByText("Manage and schedule your social media posts")
        ).toBeInTheDocument()

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("First Post")).toBeInTheDocument()
        })
    })

    it("renders filter bar with available channels", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("Filter by Channel")).toBeInTheDocument()
        })

        expect(screen.getByText("My Facebook Page")).toBeInTheDocument()
        expect(screen.getByText("My Instagram")).toBeInTheDocument()
        expect(screen.getByText("My Twitter")).toBeInTheDocument()
    })

    it("displays all posts initially", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("First Post")).toBeInTheDocument()
        })

        expect(screen.getByText("Published Post")).toBeInTheDocument()
        expect(screen.getByText("Failed Post")).toBeInTheDocument()
    })

    it("filters posts by selected channel", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("My Facebook Page")).toBeInTheDocument()
        })

        // Click on Facebook filter
        const facebookButton = screen.getByText("My Facebook Page")
        fireEvent.click(facebookButton)

        // Should show only posts with Facebook channel
        await waitFor(() => {
            expect(screen.getByText("First Post")).toBeInTheDocument()
        })
        expect(screen.queryByText("Published Post")).not.toBeInTheDocument()
        expect(screen.queryByText("Failed Post")).not.toBeInTheDocument()
    })

    it("shows clear filters button when filters are applied", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("My Facebook Page")).toBeInTheDocument()
        })

        // Click on a filter
        const facebookButton = screen.getByText("My Facebook Page")
        fireEvent.click(facebookButton)

        // Clear filters button should appear
        await waitFor(() => {
            expect(screen.getByText("Clear all filters")).toBeInTheDocument()
        })

        // Click clear filters
        fireEvent.click(screen.getByText("Clear all filters"))

        // All posts should be visible again
        await waitFor(() => {
            expect(screen.getByText("First Post")).toBeInTheDocument()
            expect(screen.getByText("Published Post")).toBeInTheDocument()
            expect(screen.getByText("Failed Post")).toBeInTheDocument()
        })
    })

    it("displays correct post count", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("Showing 3 of 3 posts")).toBeInTheDocument()
        })
    })

    it("displays status badges for posts", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("scheduled")).toBeInTheDocument()
        })

        expect(screen.getByText("published")).toBeInTheDocument()
        expect(screen.getByText("failed")).toBeInTheDocument()
    })

    it("displays channel badges for posts", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("facebook")).toBeInTheDocument()
        })

        expect(screen.getByText("instagram")).toBeInTheDocument()
        expect(screen.getByText("twitter")).toBeInTheDocument()
    })

    it("disables edit button for published posts", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("published")).toBeInTheDocument()
        })

        // Find the published post by its status badge
        const publishedBadge = screen.getByText("published")
        const postCard =
            publishedBadge.closest("div")?.parentElement?.parentElement
        const editButton = postCard?.querySelector("button")

        expect(editButton).toBeDisabled()
    })

    it("enables edit button for scheduled posts", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getAllByText("Edit").length).toBeGreaterThan(0)
        })

        // Find the edit button for the scheduled post
        const editButtons = screen.getAllByText("Edit")
        const scheduledPostEditButton = editButtons[0] // First post is scheduled

        expect(scheduledPostEditButton).not.toBeDisabled()
    })

    it("renders children when provided", () => {
        render(
            <PublishContainer>
                <div>Custom Content</div>
            </PublishContainer>
        )

        expect(screen.getByText("Custom Content")).toBeInTheDocument()
        expect(screen.queryByText("Publish")).not.toBeInTheDocument()
    })

    it("displays error message for failed posts", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(
                screen.getByText("Error: Failed to connect to TikTok API")
            ).toBeInTheDocument()
        })
    })

    it("handles multiple channel filters", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("My Facebook Page")).toBeInTheDocument()
        })

        // Click on Facebook and Twitter filters
        fireEvent.click(screen.getByText("My Facebook Page"))
        fireEvent.click(screen.getByText("My Twitter"))

        // Should show posts with either Facebook or Twitter
        await waitFor(() => {
            expect(screen.getByText("First Post")).toBeInTheDocument() // Has Facebook
            expect(screen.getByText("Published Post")).toBeInTheDocument() // Has Twitter
        })
        expect(screen.queryByText("Failed Post")).not.toBeInTheDocument() // Has TikTok
    })

    it("does not show disconnected channels in filter", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("My Facebook Page")).toBeInTheDocument()
        })

        // TikTok is not connected, so it should not appear in the filter bar
        expect(screen.queryByText("My TikTok")).not.toBeInTheDocument()
    })

    it("sorts posts by date (newest first)", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            const postTitles = screen.getAllByRole("heading", { level: 3 })
            expect(postTitles.length).toBeGreaterThan(0)
        })

        const postTitles = screen.getAllByRole("heading", { level: 3 })
        // Posts should be sorted with newest first
        // First Post (scheduled 1 day in future) is newest
        // Failed Post (scheduled 12 hours ago) is next
        // Published Post (published 1 day ago) is oldest
        expect(postTitles[0]).toHaveTextContent("First Post")
        expect(postTitles[1]).toHaveTextContent("Failed Post")
        expect(postTitles[2]).toHaveTextContent("Published Post")
    })

    it("shows all posts when no filters are applied", async () => {
        render(<PublishContainer />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText("First Post")).toBeInTheDocument()
        })

        // All posts should be visible
        expect(screen.getByText("Published Post")).toBeInTheDocument()
        expect(screen.getByText("Failed Post")).toBeInTheDocument()
    })
})
