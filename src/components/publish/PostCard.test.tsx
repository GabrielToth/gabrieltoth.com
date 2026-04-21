import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { Post } from "./PostCard"
import { PostCard } from "./PostCard"

describe("PostCard Component", () => {
    const mockPost: Post = {
        id: "1",
        title: "Test Post",
        content: "This is a test post",
        scheduledAt: new Date("2024-12-31T10:00:00"),
        status: "scheduled",
        channels: ["facebook", "instagram"],
        createdAt: new Date(),
    }

    it("renders post title and content", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostCard
                post={mockPost}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        expect(screen.getByText("Test Post")).toBeInTheDocument()
        expect(screen.getByText("This is a test post")).toBeInTheDocument()
    })

    it("displays post status badge", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostCard
                post={mockPost}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        expect(screen.getByText("scheduled")).toBeInTheDocument()
    })

    it("displays channel badges", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostCard
                post={mockPost}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        expect(screen.getByText("facebook")).toBeInTheDocument()
        expect(screen.getByText("instagram")).toBeInTheDocument()
    })

    it("calls onEdit when edit button is clicked", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostCard
                post={mockPost}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        const editButton = screen.getByText("Edit")
        fireEvent.click(editButton)

        expect(mockOnEdit).toHaveBeenCalledWith(mockPost)
    })

    it("calls onDelete when delete button is clicked", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostCard
                post={mockPost}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        const deleteButton = screen.getByText("Delete")
        fireEvent.click(deleteButton)

        expect(mockOnDelete).toHaveBeenCalledWith(mockPost)
    })

    it("disables edit button for published posts", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()
        const publishedPost: Post = {
            ...mockPost,
            status: "published",
            publishedAt: new Date(),
        }

        render(
            <PostCard
                post={publishedPost}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        const editButton = screen.getByText("Edit")
        expect(editButton).toBeDisabled()
    })

    it("enables edit button for failed posts", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()
        const failedPost: Post = {
            ...mockPost,
            status: "failed",
            errorMessage: "Failed to publish",
        }

        render(
            <PostCard
                post={failedPost}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        const editButton = screen.getByText("Edit")
        expect(editButton).not.toBeDisabled()
    })

    it("displays error message for failed posts", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()
        const failedPost: Post = {
            ...mockPost,
            status: "failed",
            errorMessage: "API connection failed",
        }

        render(
            <PostCard
                post={failedPost}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        expect(screen.getByText(/API connection failed/)).toBeInTheDocument()
    })

    it("displays published date for published posts", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()
        const publishedDate = new Date("2024-12-25T15:30:00")
        const publishedPost: Post = {
            ...mockPost,
            status: "published",
            publishedAt: publishedDate,
        }

        render(
            <PostCard
                post={publishedPost}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        expect(screen.getByText(/Published:/)).toBeInTheDocument()
    })

    it("displays scheduled date for scheduled posts", () => {
        const mockOnEdit = vi.fn()
        const mockOnDelete = vi.fn()

        render(
            <PostCard
                post={mockPost}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
            />
        )

        expect(screen.getByText(/Scheduled:/)).toBeInTheDocument()
    })
})
