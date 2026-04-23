/**
 * Field Editor Component Tests
 *
 * Tests for inline field editing
 *
 * Validates: Requirements 4.7
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import FieldEditor from "./field-editor"

// Mock next-intl
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            "completeAccount.saving": "Saving...",
            "completeAccount.save": "Save",
            "completeAccount.cancel": "Cancel",
        }
        return translations[key] || key
    },
}))

describe("FieldEditor", () => {
    const defaultProps = {
        label: "Email",
        value: "user@example.com",
        placeholder: "your@email.com",
        type: "email" as const,
        error: undefined,
        onSave: vi.fn(),
        onCancel: vi.fn(),
        isLoading: false,
    }

    it("should render input field with initial value", () => {
        render(<FieldEditor {...defaultProps} />)

        const input = screen.getByDisplayValue("user@example.com")
        expect(input).toBeInTheDocument()
    })

    it("should display label", () => {
        render(<FieldEditor {...defaultProps} />)

        expect(screen.getByText("Email")).toBeInTheDocument()
    })

    it("should display save and cancel buttons", () => {
        render(<FieldEditor {...defaultProps} />)

        expect(screen.getByText("Save")).toBeInTheDocument()
        expect(screen.getByText("Cancel")).toBeInTheDocument()
    })

    it("should call onSave when save button is clicked", () => {
        const onSave = vi.fn()
        render(<FieldEditor {...defaultProps} onSave={onSave} />)

        const input = screen.getByDisplayValue("user@example.com")
        fireEvent.change(input, { target: { value: "newemail@example.com" } })

        const saveButton = screen.getByText("Save")
        fireEvent.click(saveButton)

        expect(onSave).toHaveBeenCalledWith("newemail@example.com")
    })

    it("should call onCancel when cancel button is clicked", () => {
        const onCancel = vi.fn()
        render(<FieldEditor {...defaultProps} onCancel={onCancel} />)

        const cancelButton = screen.getByText("Cancel")
        fireEvent.click(cancelButton)

        expect(onCancel).toHaveBeenCalled()
    })

    it("should display error message", () => {
        const props = {
            ...defaultProps,
            error: "Invalid email format",
        }

        render(<FieldEditor {...props} />)

        expect(screen.getByText("Invalid email format")).toBeInTheDocument()
    })

    it("should disable save button when input is empty", () => {
        render(<FieldEditor {...defaultProps} />)

        const input = screen.getByDisplayValue("user@example.com")
        fireEvent.change(input, { target: { value: "" } })

        const saveButton = screen.getByText("Save")
        expect(saveButton).toBeDisabled()
    })

    it("should disable save button when input is only whitespace", () => {
        render(<FieldEditor {...defaultProps} />)

        const input = screen.getByDisplayValue("user@example.com")
        fireEvent.change(input, { target: { value: "   " } })

        const saveButton = screen.getByText("Save")
        expect(saveButton).toBeDisabled()
    })

    it("should disable buttons when loading", () => {
        render(<FieldEditor {...defaultProps} isLoading={true} />)

        const saveButton = screen.getByText("Saving...")
        const cancelButton = screen.getByText("Cancel")

        expect(saveButton).toBeDisabled()
        expect(cancelButton).toBeDisabled()
    })

    it("should support different input types", () => {
        const { rerender } = render(
            <FieldEditor {...defaultProps} type="password" />
        )

        let input = screen.getByDisplayValue(
            "user@example.com"
        ) as HTMLInputElement
        expect(input.type).toBe("password")

        rerender(<FieldEditor {...defaultProps} type="tel" />)

        input = screen.getByDisplayValue("user@example.com") as HTMLInputElement
        expect(input.type).toBe("tel")
    })

    it("should update input value when user types", () => {
        render(<FieldEditor {...defaultProps} />)

        const input = screen.getByDisplayValue(
            "user@example.com"
        ) as HTMLInputElement
        fireEvent.change(input, { target: { value: "newemail@example.com" } })

        expect(input.value).toBe("newemail@example.com")
    })

    it("should display placeholder text", () => {
        render(<FieldEditor {...defaultProps} />)

        const input = screen.getByPlaceholderText("your@email.com")
        expect(input).toBeInTheDocument()
    })

    it("should not call onSave if input is empty", () => {
        const onSave = vi.fn()
        render(<FieldEditor {...defaultProps} onSave={onSave} />)

        const input = screen.getByDisplayValue("user@example.com")
        fireEvent.change(input, { target: { value: "" } })

        const saveButton = screen.getByText("Save")
        fireEvent.click(saveButton)

        expect(onSave).not.toHaveBeenCalled()
    })
})
