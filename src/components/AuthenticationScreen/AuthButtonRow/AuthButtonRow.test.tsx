/**
 * AuthButtonRow Component Tests
 * Tests for rendering all 5 buttons in correct order with proper spacing
 *
 * Validates: Requirements 1.0, 1.1
 */

import { render, screen } from "@testing-library/react"
import { AuthButtonRow } from "./AuthButtonRow"

describe("AuthButtonRow Component", () => {
    const mockHandlers = {
        onGoogleClick: vi.fn(),
        onEmailClick: vi.fn(),
        onSSOClick: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should render all 5 authentication buttons", () => {
        render(
            <AuthButtonRow
                onGoogleClick={mockHandlers.onGoogleClick}
                onEmailClick={mockHandlers.onEmailClick}
                onSSOClick={mockHandlers.onSSOClick}
            />
        )

        // Check for all button labels
        expect(screen.getByLabelText("Sign in with Google")).toBeInTheDocument()
        expect(screen.getByLabelText("Sign in with email")).toBeInTheDocument()
        expect(
            screen.getByLabelText("Sign in with Single Sign-On")
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText("Sign in with Apple (coming soon)")
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText("Sign in with Facebook (coming soon)")
        ).toBeInTheDocument()
    })

    it("should render buttons in correct order", () => {
        const { container } = render(
            <AuthButtonRow
                onGoogleClick={mockHandlers.onGoogleClick}
                onEmailClick={mockHandlers.onEmailClick}
                onSSOClick={mockHandlers.onSSOClick}
            />
        )

        const buttons = container.querySelectorAll("button")
        expect(buttons).toHaveLength(5)

        // Verify order: google, email, sso, apple, facebook
        expect(buttons[0]).toHaveAttribute("data-provider", "google")
        expect(buttons[1]).toHaveAttribute("data-provider", "email")
        expect(buttons[2]).toHaveAttribute("data-provider", "sso")
        expect(buttons[3]).toHaveAttribute("data-provider", "apple")
        expect(buttons[4]).toHaveAttribute("data-provider", "facebook")
    })

    it("should have correct accessibility attributes", () => {
        const { container } = render(
            <AuthButtonRow
                onGoogleClick={mockHandlers.onGoogleClick}
                onEmailClick={mockHandlers.onEmailClick}
                onSSOClick={mockHandlers.onSSOClick}
            />
        )

        const buttonRow = container.querySelector("[role=\"group\"]")
        expect(buttonRow).toHaveAttribute(
            "aria-label",
            "Authentication methods"
        )
    })

    it("should disable Apple and Facebook buttons", () => {
        render(
            <AuthButtonRow
                onGoogleClick={mockHandlers.onGoogleClick}
                onEmailClick={mockHandlers.onEmailClick}
                onSSOClick={mockHandlers.onSSOClick}
            />
        )

        const appleButton = screen.getByLabelText(
            "Sign in with Apple (coming soon)"
        )
        const facebookButton = screen.getByLabelText(
            "Sign in with Facebook (coming soon)"
        )

        expect(appleButton).toBeDisabled()
        expect(facebookButton).toBeDisabled()
    })

    it("should enable Google, Email, and SSO buttons", () => {
        render(
            <AuthButtonRow
                onGoogleClick={mockHandlers.onGoogleClick}
                onEmailClick={mockHandlers.onEmailClick}
                onSSOClick={mockHandlers.onSSOClick}
            />
        )

        const googleButton = screen.getByLabelText("Sign in with Google")
        const emailButton = screen.getByLabelText("Sign in with email")
        const ssoButton = screen.getByLabelText("Sign in with Single Sign-On")

        expect(googleButton).not.toBeDisabled()
        expect(emailButton).not.toBeDisabled()
        expect(ssoButton).not.toBeDisabled()
    })

    it("should show loading state for specified provider", () => {
        const { container } = render(
            <AuthButtonRow
                onGoogleClick={mockHandlers.onGoogleClick}
                onEmailClick={mockHandlers.onEmailClick}
                onSSOClick={mockHandlers.onSSOClick}
                loadingProvider="google"
            />
        )

        const googleButton = screen.getByLabelText("Sign in with Google")
        expect(googleButton).toHaveAttribute("aria-busy", "true")
        expect(googleButton).toBeDisabled()
    })

    it("should render button row with correct role and aria-label", () => {
        const { container } = render(
            <AuthButtonRow
                onGoogleClick={mockHandlers.onGoogleClick}
                onEmailClick={mockHandlers.onEmailClick}
                onSSOClick={mockHandlers.onSSOClick}
            />
        )

        const buttonRow = container.querySelector("[role=\"group\"]")
        expect(buttonRow).toBeInTheDocument()
        expect(buttonRow).toHaveAttribute(
            "aria-label",
            "Authentication methods"
        )
    })
})
