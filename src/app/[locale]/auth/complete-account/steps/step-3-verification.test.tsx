/**
 * Step 3: Verification Component Tests
 *
 * Tests for final verification and submission
 *
 * Validates: Requirements 4.5, 7.1
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import Step3Verification from "./step-3-verification"

// Mock next-intl
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            "completeAccount.step3.description":
                "Please review all your information before completing your account setup",
            "completeAccount.step3.prefilledData": "Your Information",
            "completeAccount.step3.newFields": "Additional Information",
            "completeAccount.step3.edit": "Edit",
            "completeAccount.step3.complete": "Complete Account Setup",
            "completeAccount.step3.info":
                "By completing your account, you agree to our Terms of Service and Privacy Policy",
            "completeAccount.back": "Back",
            "completeAccount.loading": "Processing...",
            "completeAccount.errors.validationFailed":
                "Please fix the errors below",
            "completeAccount.errors.invalidEmail": "Invalid email",
            "completeAccount.errors.invalidPassword": "Invalid password",
            "completeAccount.step1.email": "Email",
            "completeAccount.step1.name": "Full Name",
            "completeAccount.step2.password": "Password",
            "completeAccount.step2.phone": "Phone Number",
            "completeAccount.step2.birthDate": "Birth Date",
        }
        return translations[key] || key
    },
}))

describe("Step3Verification", () => {
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
        newFields: {
            password: "SecurePass123!",
            phone: "+1234567890",
            birthDate: "1990-01-01",
        },
        errors: {},
        onEditSection: vi.fn(),
        onSubmit: vi.fn(),
        onBack: vi.fn(),
        isLoading: false,
    }

    it("should render verification step", () => {
        render(<Step3Verification {...defaultProps} />)

        expect(
            screen.getByText(
                "Please review all your information before completing your account setup"
            )
        ).toBeInTheDocument()
    })

    it("should display pre-filled data section", () => {
        render(<Step3Verification {...defaultProps} />)

        expect(screen.getByText("Your Information")).toBeInTheDocument()
        expect(screen.getByText("user@example.com")).toBeInTheDocument()
        expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    it("should display new fields section", () => {
        render(<Step3Verification {...defaultProps} />)

        expect(screen.getByText("Additional Information")).toBeInTheDocument()
        expect(screen.getByText("+1234567890")).toBeInTheDocument()
        expect(screen.getByText("1990-01-01")).toBeInTheDocument()
    })

    it("should mask password in verification", () => {
        render(<Step3Verification {...defaultProps} />)

        // Password should be masked
        expect(screen.getByText("••••••••")).toBeInTheDocument()
    })

    it("should display edit buttons for each section", () => {
        render(<Step3Verification {...defaultProps} />)

        const editButtons = screen.getAllByText("Edit")
        expect(editButtons.length).toBeGreaterThanOrEqual(2)
    })

    it("should call onEditSection when edit button for prefilled data is clicked", () => {
        const onEditSection = vi.fn()
        render(
            <Step3Verification
                {...defaultProps}
                onEditSection={onEditSection}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        fireEvent.click(editButtons[0])

        expect(onEditSection).toHaveBeenCalledWith("prefilled")
    })

    it("should call onEditSection when edit button for new fields is clicked", () => {
        const onEditSection = vi.fn()
        render(
            <Step3Verification
                {...defaultProps}
                onEditSection={onEditSection}
            />
        )

        const editButtons = screen.getAllByText("Edit")
        fireEvent.click(editButtons[1])

        expect(onEditSection).toHaveBeenCalledWith("newFields")
    })

    it("should display back and complete buttons", () => {
        render(<Step3Verification {...defaultProps} />)

        expect(screen.getByText("Back")).toBeInTheDocument()
        expect(screen.getByText("Complete Account Setup")).toBeInTheDocument()
    })

    it("should call onBack when back button is clicked", () => {
        const onBack = vi.fn()
        render(<Step3Verification {...defaultProps} onBack={onBack} />)

        const backButton = screen.getByText("Back")
        fireEvent.click(backButton)

        expect(onBack).toHaveBeenCalled()
    })

    it("should call onSubmit when complete button is clicked", () => {
        const onSubmit = vi.fn()
        render(<Step3Verification {...defaultProps} onSubmit={onSubmit} />)

        const completeButton = screen.getByText("Complete Account Setup")
        fireEvent.click(completeButton)

        expect(onSubmit).toHaveBeenCalled()
    })

    it("should display submit error message", () => {
        const props = {
            ...defaultProps,
            errors: {
                submit: "validationFailed",
            },
        }

        render(<Step3Verification {...props} />)

        // Component only displays submit errors, not individual field errors
        expect(
            screen.getByText("Please fix the errors below")
        ).toBeInTheDocument()
    })

    it("should not disable complete button based on errors", () => {
        const props = {
            ...defaultProps,
            errors: {
                email: "Invalid email",
            },
        }

        render(<Step3Verification {...props} />)

        const completeButton = screen.getByText("Complete Account Setup")
        // Component doesn't disable button based on errors
        expect(completeButton).not.toBeDisabled()
    })

    it("should disable buttons when loading", () => {
        render(<Step3Verification {...defaultProps} isLoading={true} />)

        const backButton = screen.getByText("Back")
        const completeButton = screen.getByText("Processing...")

        expect(backButton).toBeDisabled()
        expect(completeButton).toBeDisabled()
    })

    it("should display info message", () => {
        render(<Step3Verification {...defaultProps} />)

        expect(
            screen.getByText(
                "By completing your account, you agree to our Terms of Service and Privacy Policy"
            )
        ).toBeInTheDocument()
    })
})
