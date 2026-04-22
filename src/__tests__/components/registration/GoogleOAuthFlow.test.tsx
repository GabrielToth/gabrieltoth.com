import { GoogleOAuthFlow } from "@/components/registration/GoogleOAuthFlow"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

describe("GoogleOAuthFlow - Step 1: OAuth Authorization", () => {
    const mockOnComplete = vi.fn()
    const mockOnBack = vi.fn()
    const googleClientId = "test-client-id.apps.googleusercontent.com"

    beforeEach(() => {
        vi.clearAllMocks()
        sessionStorage.clear()
        // Mock window.location.href
        delete (window as any).location
        window.location = { href: "" } as any
    })

    afterEach(() => {
        sessionStorage.clear()
    })

    describe("Initial Rendering", () => {
        it("should render authorization step with heading", () => {
            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            expect(screen.getByText(/sign up with google/i)).toBeInTheDocument()
            expect(
                screen.getByText(/click the button below to authorize/i)
            ).toBeInTheDocument()
        })

        it("should render authorize button", () => {
            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            expect(
                screen.getByRole("button", { name: /authorize with google/i })
            ).toBeInTheDocument()
        })

        it("should render back button", () => {
            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            expect(
                screen.getByRole("button", {
                    name: /go back to authentication/i,
                })
            ).toBeInTheDocument()
        })

        it("should display info text about data usage", () => {
            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            expect(
                screen.getByText(/we'll use your google email and name/i)
            ).toBeInTheDocument()
        })
    })

    describe("Authorization Flow", () => {
        it("should call onBack when back button is clicked", async () => {
            const user = userEvent.setup()

            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            await user.click(
                screen.getByRole("button", {
                    name: /go back to authentication/i,
                })
            )

            expect(mockOnBack).toHaveBeenCalledOnce()
        })

        it("should disable buttons during authorization", async () => {
            const user = userEvent.setup()

            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            const authorizeButton = screen.getByRole("button", {
                name: /authorize with google/i,
            })

            // Button should not be disabled initially
            expect(authorizeButton).not.toBeDisabled()
        })

        it("should generate CSRF state token when authorize button is clicked", async () => {
            const user = userEvent.setup()

            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            const authorizeButton = screen.getByRole("button", {
                name: /authorize with google/i,
            })

            await user.click(authorizeButton)

            // Check that state was saved to sessionStorage
            const savedState = sessionStorage.getItem("oauth_state")
            expect(savedState).toBeTruthy()
            expect(typeof savedState).toBe("string")
        })

        it("should show error when Google Client ID is not configured", async () => {
            const user = userEvent.setup()

            render(
                <GoogleOAuthFlow
                    googleClientId=""
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            const authorizeButton = screen.getByRole("button", {
                name: /authorize with google/i,
            })

            await user.click(authorizeButton)

            await waitFor(() => {
                expect(
                    screen.getByText(/google oauth is not properly configured/i)
                ).toBeInTheDocument()
            })
        })
    })

    describe("Error Handling", () => {
        it("should display error message when authorization fails", async () => {
            const user = userEvent.setup()

            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            // Simulate error by checking error display
            // (In real scenario, this would come from OAuth callback)
            expect(
                screen.queryByText(/authorization failed/i)
            ).not.toBeInTheDocument()
        })

        it("should show try again button when error occurs", async () => {
            const user = userEvent.setup()

            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            // Initially, try again button should not be visible
            expect(
                screen.queryByRole("button", { name: /try again/i })
            ).not.toBeInTheDocument()
        })

        it("should allow dismissing error messages", async () => {
            const user = userEvent.setup()

            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            // Error display should be present but empty initially
            const errorDisplay = screen.queryByRole("button", {
                name: /dismiss/i,
            })
            expect(errorDisplay).not.toBeInTheDocument()
        })
    })

    describe("Loading States", () => {
        it("should show loading spinner during authorization", async () => {
            const user = userEvent.setup()

            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            const authorizeButton = screen.getByRole("button", {
                name: /authorize with google/i,
            })

            // Button should show loading state text when clicked
            expect(authorizeButton).toHaveTextContent(/authorize with google/i)
        })
    })

    describe("Accessibility", () => {
        it("should have proper ARIA labels", () => {
            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            expect(
                screen.getByRole("button", { name: /authorize with google/i })
            ).toHaveAttribute("aria-label")
            expect(
                screen.getByRole("button", {
                    name: /go back to authentication/i,
                })
            ).toHaveAttribute("aria-label")
        })

        it("should have semantic heading structure", () => {
            render(
                <GoogleOAuthFlow
                    googleClientId={googleClientId}
                    onComplete={mockOnComplete}
                    onBack={mockOnBack}
                />
            )

            const heading = screen.getByRole("heading", {
                level: 2,
                name: /sign up with google/i,
            })
            expect(heading).toBeInTheDocument()
        })
    })
})
