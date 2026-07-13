import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import BasicInfoSection from "./BasicInfoSection"

describe("BasicInfoSection", () => {
    const defaultProps = {
        title: "",
        onTitleChange: vi.fn(),
        description: "",
        onDescriptionChange: vi.fn(),
        tags: [] as string[],
        onTagsChange: vi.fn(),
        errors: {} as Record<string, string>,
    }

    it("renders all input fields", () => {
        render(<BasicInfoSection {...defaultProps} />)
        expect(screen.getByText("Title")).toBeInTheDocument()
        expect(screen.getByText("Description")).toBeInTheDocument()
        expect(screen.getByText("Tags")).toBeInTheDocument()
        expect(
            screen.getByText(
                "Thumbnail is auto-generated. You can customize it later in YouTube Studio."
            )
        ).toBeInTheDocument()
    })

    it("calls onTitleChange when typing in title", () => {
        const onTitleChange = vi.fn()
        render(
            <BasicInfoSection {...defaultProps} onTitleChange={onTitleChange} />
        )
        const input = screen.getByPlaceholderText("Enter your video title")
        fireEvent.change(input, { target: { value: "My Video Title" } })
        expect(onTitleChange).toHaveBeenCalledWith("My Video Title")
    })

    it("shows title char count", () => {
        render(<BasicInfoSection {...defaultProps} title="Hello" />)
        // Text is "5/100 Maximum 100 characters" but spans multiple elements
        expect(screen.getByText(/5\/100/)).toBeInTheDocument()
        expect(screen.getByText(/Maximum 100 characters/)).toBeInTheDocument()
    })

    it("shows error when title error is provided", () => {
        render(
            <BasicInfoSection
                {...defaultProps}
                errors={{ title: "Title is required" }}
            />
        )
        expect(screen.getByText("Title is required")).toBeInTheDocument()
    })

    it("shows tag count", () => {
        render(<BasicInfoSection {...defaultProps} tags={["tag1", "tag2"]} />)
        expect(screen.getByText("2/30 tags")).toBeInTheDocument()
    })
})
