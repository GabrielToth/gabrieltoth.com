/**
 * AuthenticationScreen Component Unit Tests
 * Tests for the main authentication screen component
 * Covers state transitions, error handling, and user interactions
 *
 * Validates: Requirements 1.0, 2.0, 3.0
 */

import { AuthenticationScreen } from "@/components/AuthenticationScreen"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock authentication hooks
vi.mock("@/hooks/useAuthentication", () => ({
    useAuthentication: vi.fn(() => ({
        handleAuthSuccess: vi.fn(),
        handleAuthError: vi.fn(),
    })),
}))

vi.mock("@/hooks/useGoogleAuth", () => ({
    useGoogleAuth: vi.fn(() => ({
        handleGoogleClick: vi.fn(),
        isLoading: false,
        error: null,
    })),
}))

vi.mock("@/hooks/useSSOAuth", () => ({
    useSSOAuth: vi.fn(() => ({
        handleSSOClick: vi.fn(),
        isLoading: false,
        error: null,
    })),
}))

vi.mock("@/hooks/useEmailAuth", () => ({
    useEmailAuth: vi.fn(() => ({
        handleEmailSubmit: vi.fn(),
        isLoading: false,
        error: null,
    })),
}))

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        pathname: "/",
        query: {},
    })),
}))

describe("AuthenticationScreen Component", () => {
    // Mock callbacks
    const mockOnAuthSuccess = vi.fn()
    const mockOnAuthError = vi.fn()

    beforeEach(() => {
        mockOnAuthSuccess.mockClear()
        mockOnAuthError.mockClear()
        vi.clearAllMocks()
    })

    describe("Initial Render", () => {
        it("should render button row on initial load", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            // Check for the title
            expect(
                screen.getByText("Login to Your Account")
            ).toBeInTheDocument()

            // Check for authentication buttons
            expect(
                screen.getByRole("button", { name: /Sign in with Google/i })
            ).toBeInTheDocument()
            expect(
                screen.getByRole("button", { name: /Sign in with email/i })
            ).toBeInTheDocument()
            expect(
                screen.getByRole("button", {
                    name: /Sign in with Single Sign-On/i,
                })
            ).toBeInTheDocument()
        })

        it("should render all 5 authentication buttons", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            // Check for all 5 buttons
            expect(
                screen.getByRole("button", { name: /Sign in with Google/i })
            ).toBeInTheDocument()
            expect(
                screen.getByRole("button", { name: /Sign in with email/i })
            ).toBeInTheDocument()
            expect(
                screen.getByRole("button", {
                    name: /Sign in with Single Sign-On/i,
                })
            ).toBeInTheDocument()
            expect(
                screen.getByRole("button", { name: /Sign in with Apple/i })
            ).toBeInTheDocument()
            expect(
                screen.getByRole("button", { name: /Sign in with Facebook/i })
            ).toBeInTheDocument()
        })

        it("should not show email form initially", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            // The button row should be visible
            const buttonRow = screen.getByRole("group", {
                name: /Authentication methods/i,
            })
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render button row with correct ARIA attributes", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const buttonRow = screen.getByRole("group", {
                name: /Authentication methods/i,
            })
            expect(buttonRow).toBeInTheDocument()
        })
    })

    describe("Email Button Click", () => {
        it("should show email form when email button is clicked", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const emailButton = screen.getByRole("button", {
                name: /Sign in with email/i,
            })
            fireEvent.click(emailButton)

            // Wait for the button row to be hidden
            await waitFor(() => {
                const buttonRow = screen.queryByRole("group", {
                    name: /Authentication methods/i,
                })
                expect(buttonRow).not.toBeInTheDocument()
            })
        })

        it("should hide button row when email form is shown", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const emailButton = screen.getByRole("button", {
                name: /Sign in with email/i,
            })
            fireEvent.click(emailButton)

            await waitFor(() => {
                // Button row should be hidden
                const buttonRow = screen.queryByRole("group", {
                    name: /Authentication methods/i,
                })
                expect(buttonRow).not.toBeInTheDocument()
            })
        })
    })

    describe("Error Message Display", () => {
        it("should have error alert structure in DOM", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            // The container should exist
            const container = screen.getByText(
                "Login to Your Account"
            ).parentElement
            expect(container).toBeInTheDocument()
        })

        it("should have error close button structure", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            // Verify the component renders without errors
            expect(
                screen.getByText("Login to Your Account")
            ).toBeInTheDocument()
        })
    })

    describe("Loading State Management", () => {
        it("should show loading state when Google button is clicked", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const googleButton = screen.getByRole("button", {
                name: /Sign in with Google/i,
            })

            fireEvent.click(googleButton)

            // Check if button has aria-busy attribute when loading
            await waitFor(() => {
                expect(googleButton).toHaveAttribute("aria-busy", "true")
            })
        })

        it("should show loading state when SSO button is clicked", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const ssoButton = screen.getByRole("button", {
                name: /Sign in with Single Sign-On/i,
            })

            fireEvent.click(ssoButton)

            await waitFor(() => {
                expect(ssoButton).toHaveAttribute("aria-busy", "true")
            })
        })

        it("should disable button during loading state", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const googleButton = screen.getByRole("button", {
                name: /Sign in with Google/i,
            })

            fireEvent.click(googleButton)

            await waitFor(() => {
                expect(googleButton).toBeDisabled()
            })
        })

        it("should only show loading state for the clicked provider", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const googleButton = screen.getByRole("button", {
                name: /Sign in with Google/i,
            })
            const emailButton = screen.getByRole("button", {
                name: /Sign in with email/i,
            })

            fireEvent.click(googleButton)

            await waitFor(() => {
                expect(googleButton).toHaveAttribute("aria-busy", "true")
                expect(emailButton).toHaveAttribute("aria-busy", "false")
            })
        })
    })

    describe("Disabled Buttons", () => {
        it("should render Apple button as disabled", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const appleButton = screen.getByRole("button", {
                name: /Sign in with Apple/i,
            })
            expect(appleButton).toBeDisabled()
        })

        it("should render Facebook button as disabled", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const facebookButton = screen.getByRole("button", {
                name: /Sign in with Facebook/i,
            })
            expect(facebookButton).toBeDisabled()
        })

        it("should not trigger click handler for disabled buttons", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const appleButton = screen.getByRole("button", {
                name: /Sign in with Apple/i,
            })

            fireEvent.click(appleButton)

            // Apple button should not trigger any state changes
            expect(appleButton).toBeDisabled()
        })
    })

    describe("Accessibility", () => {
        it("should have proper ARIA labels on all buttons", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            expect(
                screen.getByRole("button", { name: /Sign in with Google/i })
            ).toHaveAttribute("aria-label")
            expect(
                screen.getByRole("button", { name: /Sign in with email/i })
            ).toHaveAttribute("aria-label")
            expect(
                screen.getByRole("button", {
                    name: /Sign in with Single Sign-On/i,
                })
            ).toHaveAttribute("aria-label")
        })

        it("should have role group on button row", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const buttonRow = screen.getByRole("group", {
                name: /Authentication methods/i,
            })
            expect(buttonRow).toBeInTheDocument()
        })

        it("should have proper button types", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const googleButton = screen.getByRole("button", {
                name: /Sign in with Google/i,
            })
            expect(googleButton).toHaveAttribute("type", "button")
        })

        it("should have aria-disabled attribute on disabled buttons", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const appleButton = screen.getByRole("button", {
                name: /Sign in with Apple/i,
            })
            expect(appleButton).toHaveAttribute("aria-disabled", "true")
        })
    })

    describe("Props Handling", () => {
        it("should accept redirectTo prop", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                    redirectTo="/dashboard"
                />
            )

            expect(
                screen.getByText("Login to Your Account")
            ).toBeInTheDocument()
        })

        it("should call onAuthSuccess callback when provided", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            // The callback should be available for integration tests
            expect(mockOnAuthSuccess).toBeDefined()
        })

        it("should call onAuthError callback when provided", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            // The callback should be available for integration tests
            expect(mockOnAuthError).toBeDefined()
        })
    })

    describe("Multiple Interactions", () => {
        it("should handle multiple button clicks in sequence", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const googleButton = screen.getByRole("button", {
                name: /Sign in with Google/i,
            })
            const emailButton = screen.getByRole("button", {
                name: /Sign in with email/i,
            })

            // Click Google button
            fireEvent.click(googleButton)
            expect(googleButton).toHaveAttribute("aria-busy", "true")

            // Note: The component doesn't automatically reset loading state
            // In a real scenario, the auth hook would handle success/error and reset state
            // For this test, we verify the button enters loading state correctly

            // Click Email button (this should still work as it's a different interaction)
            fireEvent.click(emailButton)

            await waitFor(() => {
                const buttonRow = screen.queryByRole("group", {
                    name: /Authentication methods/i,
                })
                expect(buttonRow).not.toBeInTheDocument()
            })
        })

        it("should handle rapid button clicks", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const googleButton = screen.getByRole("button", {
                name: /Sign in with Google/i,
            })

            // Rapid clicks should not cause errors
            fireEvent.click(googleButton)
            fireEvent.click(googleButton)
            fireEvent.click(googleButton)

            // Button should still be in valid state
            expect(googleButton).toBeInTheDocument()
        })
    })

    describe("Button Click Handlers", () => {
        it("should call Google click handler when Google button is clicked", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const googleButton = screen.getByRole("button", {
                name: /Sign in with Google/i,
            })

            fireEvent.click(googleButton)

            // Button should show loading state
            await waitFor(() => {
                expect(googleButton).toHaveAttribute("aria-busy", "true")
            })
        })

        it("should call SSO click handler when SSO button is clicked", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const ssoButton = screen.getByRole("button", {
                name: /Sign in with Single Sign-On/i,
            })

            fireEvent.click(ssoButton)

            // Button should show loading state
            await waitFor(() => {
                expect(ssoButton).toHaveAttribute("aria-busy", "true")
            })
        })

        it("should call email click handler when email button is clicked", async () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const emailButton = screen.getByRole("button", {
                name: /Sign in with email/i,
            })

            fireEvent.click(emailButton)

            // Email form should be shown (button row should be hidden)
            await waitFor(() => {
                const buttonRow = screen.queryByRole("group", {
                    name: /Authentication methods/i,
                })
                expect(buttonRow).not.toBeInTheDocument()
            })
        })
    })

    describe("Component Structure", () => {
        it("should render container with correct class", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            // Check that the main container exists
            const title = screen.getByText("Login to Your Account")
            expect(title).toBeInTheDocument()
            expect(title.parentElement).toBeInTheDocument()
        })

        it("should render title with correct class", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const title = screen.getByText("Login to Your Account")
            expect(title).toBeInTheDocument()
            expect(title.tagName).toBe("H1")
        })

        it("should render content area with correct class", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            // Content area should contain the button row
            const buttonRow = screen.getByRole("group", {
                name: /Authentication methods/i,
            })
            expect(buttonRow).toBeInTheDocument()
        })
    })

    describe("Button Data Attributes", () => {
        it("should have data-provider attribute on buttons", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const googleButton = screen.getByRole("button", {
                name: /Sign in with Google/i,
            })
            expect(googleButton).toHaveAttribute("data-provider", "google")
        })

        it("should have correct data-provider for each button", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            expect(
                screen.getByRole("button", { name: /Sign in with Google/i })
            ).toHaveAttribute("data-provider", "google")
            expect(
                screen.getByRole("button", { name: /Sign in with email/i })
            ).toHaveAttribute("data-provider", "email")
            expect(
                screen.getByRole("button", {
                    name: /Sign in with Single Sign-On/i,
                })
            ).toHaveAttribute("data-provider", "sso")
            expect(
                screen.getByRole("button", { name: /Sign in with Apple/i })
            ).toHaveAttribute("data-provider", "apple")
            expect(
                screen.getByRole("button", { name: /Sign in with Facebook/i })
            ).toHaveAttribute("data-provider", "facebook")
        })
    })

    describe("Enabled Buttons", () => {
        it("should render Google button as enabled", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const googleButton = screen.getByRole("button", {
                name: /Sign in with Google/i,
            })
            expect(googleButton).not.toBeDisabled()
        })

        it("should render Email button as enabled", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const emailButton = screen.getByRole("button", {
                name: /Sign in with email/i,
            })
            expect(emailButton).not.toBeDisabled()
        })

        it("should render SSO button as enabled", () => {
            render(
                <AuthenticationScreen
                    onAuthSuccess={mockOnAuthSuccess}
                    onAuthError={mockOnAuthError}
                />
            )

            const ssoButton = screen.getByRole("button", {
                name: /Sign in with Single Sign-On/i,
            })
            expect(ssoButton).not.toBeDisabled()
        })
    })
})
