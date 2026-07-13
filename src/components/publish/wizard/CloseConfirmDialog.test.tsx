import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import CloseConfirmDialog from "./CloseConfirmDialog"

describe("CloseConfirmDialog", () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        onBackToEditing: vi.fn(),
        onSaveDraftAndClose: vi.fn(),
        onDiscardAndClose: vi.fn(),
    }

    it("renders when open is true", () => {
        render(<CloseConfirmDialog {...defaultProps} />)
        expect(screen.getByText("Discard changes?")).toBeInTheDocument()
        expect(
            screen.getByText(
                "You have unsaved content. What would you like to do?"
            )
        ).toBeInTheDocument()
    })

    it("does not render content when open is false", () => {
        render(<CloseConfirmDialog {...defaultProps} open={false} />)
        expect(screen.queryByText("Discard changes?")).not.toBeInTheDocument()
    })

    it("calls onBackToEditing when back button is clicked", () => {
        render(<CloseConfirmDialog {...defaultProps} />)
        fireEvent.click(screen.getByText("Back to Editing"))
        expect(defaultProps.onBackToEditing).toHaveBeenCalledTimes(1)
    })

    it("calls onSaveDraftAndClose when save button is clicked", () => {
        render(<CloseConfirmDialog {...defaultProps} />)
        fireEvent.click(screen.getByText("Save as Draft"))
        expect(defaultProps.onSaveDraftAndClose).toHaveBeenCalledTimes(1)
    })

    it("calls onDiscardAndClose when discard button is clicked", () => {
        render(<CloseConfirmDialog {...defaultProps} />)
        fireEvent.click(screen.getByText("Discard"))
        expect(defaultProps.onDiscardAndClose).toHaveBeenCalledTimes(1)
    })
})
