/**
 * Step 1: Pre-filled Data Component Tests
 *
 * Tests for pre-filled data review and editing
 *
 * Validates: Requirements 4.3, 4.4
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import Step1Prefilled from "./step-1-prefilled"

// Mock next-intl
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            "completeAccount.step1.description":
                "Please review your information from your OAuth provider",
            "completeAccount.step1.email": "Email",
            "completeAccount.step1.emailPlaceholder": "your@email.com",
            "completeAccount.step1.name": "Full Name",
            "completeAccount.step1.namePlaceholder": "Your Name",
            "completeAccount.step1.edit": "Edit",
            "completeAccount.step1.continue": "Continue",
            "completeAccount.saving": "Saving...",
            "completeAccount.save": "Save",
            "completeAccount.cancel": "Cancel",
            "completeAccount.loading": "Processing...",
            "completeAccount.errors.invalidEmail": "Invalid email format",
            "completeAccount.errors.emailAlreadyRegistered":
                "Email already registered",
            "completeAccount.errors.invalidPassword": "Password is too weak",
            "completeAccount.errors.invalidPhone": "Invalid phone format",
            "completeAccount.errors.invalidBirthDate": "Invalid birth date",
            "completeAccount.errors.userTooYoung":
                "You must be at least 13 years old",
            "completeAccount.errors.futureDate":
                "Birth date cannot be in the future",
            "completeAccount.errors.invalidToken": "Invalid token",
            "completeAccount.errors.serverError": "Server error",
            "completeAccount.errors.validationFailed":
                "Please fix the errors below",
        }
        return translations[key] || key
    },
}))

describe("Step1Prefilled", () => {
    const defaultProps = {
        prefilledData: {
            email: "user@example.com",
            name: "John Doe",
            picture: "https://example.com/picture.jpg",
        },
        editedData: {
            email: "user@example.com",
            name: "John Doe",
        },
        errors: {},
        onUpdateField: vi.fn(),
        onContinue: vi.fn(),
        isLoading: false,
    }

    it("should render pre-filled data", () => {
        render(<Step1Prefilled {...defaultProps} />)

        expect(screen.getByText("user@example.com")).toBeInTheDocument()
        expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    it("should display profile picture", () => {
        render(<Step1Prefilled {...defaultProps} />)

        const img = screen.getByAltText("John Doe") as HTMLImageElement
        expect(img).toBeInTheDocument()
        expect(img.src).toBe("https://example.com/picture.jpg")
    })

    it("should not display profile picture if not provided", () => {
        const props = {
            ...defaultProps,
            prefilledData: {
                email: "user@example.com",
                name: "John Doe",
            },
        }

        render(<Step1Prefilled {...props} />)

        const img = screen.queryByAltText("John Doe")
        expect(img).not.toBeInTheDocument()
    })

    it("should display edit buttons", () => {
        render(<Step1Prefilled {...defaultProps} />)

        const editButtons = screen.getAllByText("Edit")
        expect(editButtons.length).toBeGreaterThanOrEqual(2)
    })

    it("should display continue button", () => {
        render(<Step1Prefilled {...defaultProps} />)

        expect(screen.getByText("Continue")).toBeInTheDocument()
    })

    it("should call onContinue when continue button is clicked", () => {
        const onContinue = vi.fn()
        render(<Step1Prefilled {...defaultProps} onContinue={onContinue} />)

        const continueButton = screen.getByText("Continue")
        fireEvent.click(continueButton)

        expect(onContinue).toHaveBeenCalled()
    })

    it("should display error messages", () => {
        const props = {
            ...defaultProps,
            errors: {
                email: "Invalid email format",
                name: "Name is required",
            },
        }

        render(<Step1Prefilled {...props} />)

        expect(screen.getByText("Invalid email format")).toBeInTheDocument()
        expect(screen.getByText("Name is required")).toBeInTheDocument()
    })

    it("should disable continue button when loading", () => {
        render(<Step1Prefilled {...defaultProps} isLoading={true} />)

        const continueButton = screen.getByText("Processing...")
        expect(continueButton).toBeDisabled()
    })

    it("should display description text", () => {
        render(<Step1Prefilled {...defaultProps} />)

        expect(
            screen.getByText(
                "Please review your information from your OAuth provider"
            )
        ).toBeInTheDocument()
    })
})
