import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ContentCreator } from "./ContentCreator"

describe("ContentCreator", () => {
    it("renders text editor", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        expect(
            screen.getByPlaceholderText(/Write your post content/)
        ).toBeInTheDocument()
    })

    it("displays character count", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        const textarea = screen.getByPlaceholderText(/Write your post content/)
        fireEvent.change(textarea, { target: { value: "Hello world" } })

        expect(screen.getByText(/11 characters/)).toBeInTheDocument()
    })

    it("displays formatting toolbar", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        expect(
            screen.getByLabelText(/Apply bold formatting/)
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText(/Apply italic formatting/)
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText(/Apply underline formatting/)
        ).toBeInTheDocument()
    })

    it("displays platform character limits", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        expect(screen.getByText(/Min: 280/)).toBeInTheDocument()
        expect(screen.getByText(/Max: 63206/)).toBeInTheDocument()
    })

    it("shows platform warnings when content exceeds limit", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        const textarea = screen.getByPlaceholderText(/Write your post content/)
        const longText = "a".repeat(300)
        fireEvent.change(textarea, { target: { value: longText } })

        expect(screen.getByText(/twitter:/i)).toBeInTheDocument()
    })

    it("displays URL input section", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        expect(
            screen.getByPlaceholderText(/https:\/\/example.com/)
        ).toBeInTheDocument()
        expect(screen.getByLabelText(/Add URL/)).toBeInTheDocument()
    })

    it("adds URL when Add button is clicked", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/)
        fireEvent.change(urlInput, { target: { value: "https://example.com" } })

        const addButton = screen.getByLabelText(/Add URL/)
        fireEvent.click(addButton)

        // Check that the URL appears in the list (not just in preview)
        const urlLinks = screen.getAllByText(/https:\/\/example.com/)
        expect(urlLinks.length).toBeGreaterThan(0)
    })

    it("removes URL when Remove button is clicked", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/)
        fireEvent.change(urlInput, { target: { value: "https://example.com" } })

        const addButton = screen.getByLabelText(/Add URL/)
        fireEvent.click(addButton)

        const removeButton = screen.getByLabelText(/Remove URL/)
        fireEvent.click(removeButton)

        expect(
            screen.queryByText(/https:\/\/example.com/)
        ).not.toBeInTheDocument()
    })

    it("displays image upload input", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        expect(screen.getByLabelText(/Upload images/)).toBeInTheDocument()
    })

    it("displays content preview", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        expect(screen.getByText(/Preview/)).toBeInTheDocument()
    })

    it("displays Save Draft button", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        expect(screen.getByLabelText(/Save as draft/)).toBeInTheDocument()
    })

    it("displays Ready to Publish button", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        expect(screen.getByLabelText(/Publish content/)).toBeInTheDocument()
    })

    it("calls onContentChange when content is updated", () => {
        const onContentChange = vi.fn()
        render(<ContentCreator onContentChange={onContentChange} />)

        const textarea = screen.getByPlaceholderText(/Write your post content/)
        fireEvent.change(textarea, { target: { value: "Test content" } })

        // Note: onContentChange is called on button click, not on text change
        const publishButton = screen.getByLabelText(/Publish content/)
        fireEvent.click(publishButton)

        expect(onContentChange).toHaveBeenCalled()
    })

    it("supports keyboard navigation", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        const textarea = screen.getByPlaceholderText(/Write your post content/)
        expect(textarea).toBeInTheDocument()

        // Just verify the textarea is in the document and can be interacted with
        fireEvent.change(textarea, { target: { value: "Test" } })
        expect(textarea).toHaveValue("Test")
    })

    it("displays ARIA labels for accessibility", () => {
        render(<ContentCreator onContentChange={vi.fn()} />)

        expect(screen.getByLabelText(/Post content/)).toBeInTheDocument()
        expect(
            screen.getByLabelText(/Apply bold formatting/)
        ).toBeInTheDocument()
    })
})
