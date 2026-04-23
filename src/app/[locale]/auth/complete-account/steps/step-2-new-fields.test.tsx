/**
 * Step 2: New Required Fields Component Tests
 *
 * Tests for password, phone, and birth date input
 *
 * Validates: Requirements 4.4, 4.5
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import Step2NewFields from "./step-2-new-fields"

// Mock next-intl
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            "completeAccount.step2.description":
                "Please provide the following information to complete your account",
            "completeAccount.step2.password": "Password",
            "completeAccount.step2.passwordPlaceholder":
                "Enter a strong password",
            "completeAccount.step2.passwordHint":
                "At least 8 characters, with uppercase, lowercase, number, and special character",
            "completeAccount.step2.phone": "Phone Number",
            "completeAccount.step2.phonePlaceholder": "+1234567890",
            "completeAccount.step2.phoneHint":
                "International format (e.g., +1234567890)",
            "completeAccount.step2.birthDate": "Birth Date",
            "completeAccount.step2.birthDateHint": "Format: YYYY-MM-DD",
            "completeAccount.step2.continue": "Continue to Verification",
            "completeAccount.back": "Back",
            "completeAccount.loading": "Processing...",
            "completeAccount.passwordRequirements.minLength":
                "At least 8 characters",
            "completeAccount.passwordRequirements.uppercase":
                "At least one uppercase letter",
            "completeAccount.passwordRequirements.lowercase":
                "At least one lowercase letter",
            "completeAccount.passwordRequirements.number":
                "At least one number",
            "completeAccount.passwordRequirements.special":
                "At least one special character (!@#$%^&*)",
            "completeAccount.passwordRequirements.strong": "Password is strong",
            "completeAccount.passwordRequirements.weak":
                "Password needs more requirements",
        }
        return translations[key] || key
    },
}))

describe("Step2NewFields", () => {
    const defaultProps = {
        newFields: {
            password: "",
            phone: "",
            birthDate: "",
        },
        errors: {},
        onUpdateField: vi.fn(),
        onContinue: vi.fn(),
        onBack: vi.fn(),
        isLoading: false,
    }

    it("should render password input field", () => {
        render(<Step2NewFields {...defaultProps} />)

        expect(
            screen.getByPlaceholderText("Enter a strong password")
        ).toBeInTheDocument()
    })

    it("should render phone input field", () => {
        render(<Step2NewFields {...defaultProps} />)

        expect(screen.getByPlaceholderText("+1234567890")).toBeInTheDocument()
    })

    it("should render birth date field", () => {
        render(<Step2NewFields {...defaultProps} />)

        expect(screen.getByText("Birth Date")).toBeInTheDocument()
    })

    it("should display field labels", () => {
        render(<Step2NewFields {...defaultProps} />)

        expect(screen.getByText("Password")).toBeInTheDocument()
        expect(screen.getByText("Phone Number")).toBeInTheDocument()
        expect(screen.getByText("Birth Date")).toBeInTheDocument()
    })

    it("should display field hints", () => {
        render(<Step2NewFields {...defaultProps} />)

        expect(
            screen.getByText("International format (e.g., +1234567890)")
        ).toBeInTheDocument()
        expect(screen.getByText("Format: YYYY-MM-DD")).toBeInTheDocument()
    })

    it("should call onUpdateField when password changes", () => {
        const onUpdateField = vi.fn()
        render(
            <Step2NewFields {...defaultProps} onUpdateField={onUpdateField} />
        )

        const passwordInput = screen.getByPlaceholderText(
            "Enter a strong password"
        )
        fireEvent.change(passwordInput, { target: { value: "TestPass123!" } })

        expect(onUpdateField).toHaveBeenCalledWith("password", "TestPass123!")
    })

    it("should call onUpdateField when phone changes", () => {
        const onUpdateField = vi.fn()
        render(
            <Step2NewFields {...defaultProps} onUpdateField={onUpdateField} />
        )

        const phoneInput = screen.getByPlaceholderText("+1234567890")
        fireEvent.change(phoneInput, { target: { value: "+1234567890" } })

        expect(onUpdateField).toHaveBeenCalledWith("phone", "+1234567890")
    })

    it("should display error messages", () => {
        const props = {
            ...defaultProps,
            errors: {
                password: "Password is too weak",
                phone: "Invalid phone format",
                birthDate: "You must be at least 13 years old",
            },
        }

        render(<Step2NewFields {...props} />)

        expect(screen.getByText("Password is too weak")).toBeInTheDocument()
        expect(screen.getByText("Invalid phone format")).toBeInTheDocument()
        expect(
            screen.getByText("You must be at least 13 years old")
        ).toBeInTheDocument()
    })

    it("should display back and continue buttons", () => {
        render(<Step2NewFields {...defaultProps} />)

        expect(screen.getByText("Back")).toBeInTheDocument()
        expect(screen.getByText("Continue to Verification")).toBeInTheDocument()
    })

    it("should call onBack when back button is clicked", () => {
        const onBack = vi.fn()
        render(<Step2NewFields {...defaultProps} onBack={onBack} />)

        const backButton = screen.getByText("Back")
        fireEvent.click(backButton)

        expect(onBack).toHaveBeenCalled()
    })

    it("should call onContinue when continue button is clicked", () => {
        const onContinue = vi.fn()
        render(<Step2NewFields {...defaultProps} onContinue={onContinue} />)

        const continueButton = screen.getByText("Continue to Verification")
        fireEvent.click(continueButton)

        expect(onContinue).toHaveBeenCalled()
    })

    it("should disable buttons when loading", () => {
        render(<Step2NewFields {...defaultProps} isLoading={true} />)

        const backButton = screen.getByText("Back")
        const continueButton = screen.getByText("Processing...")

        expect(backButton).toBeDisabled()
        expect(continueButton).toBeDisabled()
    })

    it("should display password strength indicator when password is entered", () => {
        const props = {
            ...defaultProps,
            newFields: {
                password: "SecurePass123!",
                phone: "",
                birthDate: "",
            },
        }

        render(<Step2NewFields {...props} />)

        // Password strength component should be rendered
        expect(screen.getByText("5/5")).toBeInTheDocument()
    })

    it("should display description text", () => {
        render(<Step2NewFields {...defaultProps} />)

        expect(
            screen.getByText(
                "Please provide the following information to complete your account"
            )
        ).toBeInTheDocument()
    })
})
