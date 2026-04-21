import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { Post } from "./PostCard"
import { PostList } from "./PostList"

describe("PostList Component", () => {
    const mockPosts: Post[] = [
        {
            id: "1",
            title: "Post 1",
            content: "Content 1",
            scheduledAt: new Date(),
            status: "scheduled",
            channels: ["facebook"],
            createdAt: new Date(),
        },
        {
            id: "2",
            title: "Post 2",
            content: "Content 2",
            scheduledAt: new Date(),
            status: "published",
            channels: ["instagram"],
            createdAt: new Date(),
        },
    ]

    it("renders posts list", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostList
                posts={mockPosts}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        expect(screen.getByText("Post 1")).toBeInTheDocument()
        expect(screen.getByText("Post 2")).toBeInTheDocument()
    })

    it("shows loading skeleton when isLoading is true", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostList
                posts={[]}
                isLoading={true}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        // Check for skeleton elements (animated divs)
        const skeletons = screen.queryAllByText("")
        expect(skeletons.length).toBeGreaterThan(0)
    })

    it("shows error message when error is provided", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()
        const errorMessage = "Failed to load posts"

        render(
            <PostList
                posts={[]}
                error={errorMessage}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        expect(screen.getByText("Error loading posts")).toBeInTheDocument()
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it("shows retry button when error and onRetry are provided", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()
        const mockOnRetry = vi.fn()

        render(
            <PostList
                posts={[]}
                error="Failed to load posts"
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onRetry={mockOnRetry}
            />
        )

        const retryButton = screen.getByText("Retry")
        fireEvent.click(retryButton)

        expect(mockOnRetry).toHaveBeenCalled()
    })

    it("shows empty state when no posts", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostList posts={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
        )

        expect(screen.getByText("No posts found")).toBeInTheDocument()
    })

    it("calls onEdit when edit button is clicked", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostList
                posts={mockPosts}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        fireEvent.click(editButtons[0])

        expect(mockOnEdit).toHaveBeenCalledWith(mockPosts[0])
    })

    it("calls onDelete when delete button is clicked", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostList
                posts={mockPosts}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        const deleteButtons = screen.getAllByText("Delete")
        fireEvent.click(deleteButtons[0])

        expect(mockOnDelete).toHaveBeenCalledWith(mockPosts[0])
    })

    it("renders correct number of posts", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostList
                posts={mockPosts}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        expect(editButtons).toHaveLength(mockPosts.length)
    })
})
