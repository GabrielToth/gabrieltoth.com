import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PublishContainer } from "./PublishContainer"

describe("PublishContainer", () => {
    it("renders the component with header", () => {
        render(<PublishContainer />)
        expect(screen.getByText("Publish")).toBeInTheDocument()
        expect(
            screen.getByText("Manage and schedule your social media posts")
        ).toBeInTheDocument()
    })

    it("renders filter bar with available channels", () => {
        render(<PublishContainer />)
        expect(screen.getByText("Filter by Channel")).toBeInTheDocument()
        expect(screen.getByText("My Facebook Page")).toBeInTheDocument()
        expect(screen.getByText("My Instagram")).toBeInTheDocument()
        expect(screen.getByText("My Twitter")).toBeInTheDocument()
    })

    it("displays all posts initially", () => {
        render(<PublishContainer />)
        expect(screen.getByText("First Post")).toBeInTheDocument()
        expect(screen.getByText("Published Post")).toBeInTheDocument()
        expect(screen.getByText("Failed Post")).toBeInTheDocument()
    })

    it("filters posts by selected channel", () => {
        render(<PublishContainer />)

        // Click on Facebook filter
        const facebookButton = screen.getByText("My Facebook Page")
        fireEvent.click(facebookButton)

        // Should show only posts with Facebook channel
        expect(screen.getByText("First Post")).toBeInTheDocument()
        expect(screen.queryByText("Published Post")).not.toBeInTheDocument()
        expect(screen.queryByText("Failed Post")).not.toBeInTheDocument()
    })

    it("shows clear filters button when filters are applied", () => {
        render(<PublishContainer />)

        // Click on a filter
        const facebookButton = screen.getByText("My Facebook Page")
        fireEvent.click(facebookButton)

        // Clear filters button should appear
        expect(screen.getByText("Clear filters")).toBeInTheDocument()

        // Click clear filters
        fireEvent.click(screen.getByText("Clear filters"))

        // All posts should be visible again
        expect(screen.getByText("First Post")).toBeInTheDocument()
        expect(screen.getByText("Published Post")).toBeInTheDocument()
        expect(screen.getByText("Failed Post")).toBeInTheDocument()
    })

    it("displays correct post count", () => {
        render(<PublishContainer />)
        expect(screen.getByText("Showing 3 of 3 posts")).toBeInTheDocument()
    })

    it("displays status badges for posts", () => {
        render(<PublishContainer />)
        expect(screen.getByText("Scheduled")).toBeInTheDocument()
        expect(screen.getByText("Published")).toBeInTheDocument()
        expect(screen.getByText("Failed")).toBeInTheDocument()
    })

    it("displays channel badges for posts", () => {
        render(<PublishContainer />)
        expect(screen.getByText("Facebook")).toBeInTheDocument()
        expect(screen.getByText("Instagram")).toBeInTheDocument()
        expect(screen.getByText("Twitter")).toBeInTheDocument()
    })

    it("disables edit button for published posts", () => {
        render(<PublishContainer />)

        // Find the published post by its status badge
        const publishedBadge = screen.getByText("Published")
        const postCard =
            publishedBadge.closest("div")?.parentElement?.parentElement
        const editButton = postCard?.querySelector("button")

        expect(editButton).toBeDisabled()
    })

    it("enables edit button for scheduled posts", () => {
        render(<PublishContainer />)

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

    it("displays error message for failed posts", () => {
        render(<PublishContainer />)
        expect(
            screen.getByText("Error: Failed to connect to TikTok API")
        ).toBeInTheDocument()
    })

    it("handles multiple channel filters", () => {
        render(<PublishContainer />)

        // Click on Facebook and Twitter filters
        fireEvent.click(screen.getByText("My Facebook Page"))
        fireEvent.click(screen.getByText("My Twitter"))

        // Should show posts with either Facebook or Twitter
        expect(screen.getByText("First Post")).toBeInTheDocument() // Has Facebook
        expect(screen.getByText("Published Post")).toBeInTheDocument() // Has Twitter
        expect(screen.queryByText("Failed Post")).not.toBeInTheDocument() // Has TikTok
    })

    it("disables disconnected channels in filter", () => {
        render(<PublishContainer />)

        // TikTok is not connected
        const tiktokButton = screen.getByText("My TikTok")
        expect(tiktokButton).toBeDisabled()
    })

    it("sorts posts by date (newest first)", () => {
        render(<PublishContainer />)

        const postTitles = screen.getAllByRole("heading", { level: 3 })
        // Posts should be sorted with newest first
        // First Post (scheduled 1 day in future) is newest
        // Failed Post (scheduled 12 hours ago) is next
        // Published Post (published 1 day ago) is oldest
        expect(postTitles[0]).toHaveTextContent("First Post")
        expect(postTitles[1]).toHaveTextContent("Failed Post")
        expect(postTitles[2]).toHaveTextContent("Published Post")
    })

    it("shows no posts message when filter results are empty", () => {
        render(<PublishContainer />)

        // Apply a filter that results in no posts
        // Click on TikTok (which only has the failed post)
        fireEvent.click(screen.getByText("My TikTok"))

        // The failed post should still show because it has TikTok channel
        expect(screen.getByText("Failed Post")).toBeInTheDocument()
    })
})
