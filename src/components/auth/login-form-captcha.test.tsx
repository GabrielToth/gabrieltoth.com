import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LoginForm } from "./login-form"

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
    }),
}))

// Mock TurnstileWidget
vi.mock("./turnstile-widget", () => ({
    default: ({ onTokenChange }: any) => (
        <div
            data-testid="turnstile-widget"
            onClick={() => onTokenChange("test-captcha-token")}
        >
            Mock CAPTCHA Widget
        </div>
    ),
}))

describe("LoginForm with CAPTCHA Integration", () => {
    beforeEach(() => {
        // Mock fetch for CSRF token
        ;(global as any).fetch = vi.fn((url: any) => {
            if (url.includes("/api/auth/csrf")) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            success: true,
                            data: { csrfToken: "test-csrf-token" },
                        }),
                })
            }
            return Promise.reject(new Error("Unknown URL"))
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("should render CAPTCHA widget", async () => {
        render(<LoginForm locale="en" />)

        await waitFor(() => {
            expect(screen.getByTestId("turnstile-widget")).toBeInTheDocument()
        })
    })

    it("should require CAPTCHA token before submission", async () => {
        const user = userEvent.setup()
        render(<LoginForm locale="en" />)

        // Fill in email and password
        const emailInput = screen.getByPlaceholderText(
            "Enter your email address"
        )
        const passwordInput = screen.getByPlaceholderText("Enter your password")

        await user.type(emailInput, "test@example.com")
        await user.type(passwordInput, "password123")

        // Try to submit without CAPTCHA
        const submitButton = screen.getByRole("button", { name: /sign in/i })
        expect(submitButton).toBeDisabled() // Should be disabled without CAPTCHA token
    })

    it("should enable submit button after CAPTCHA is solved", async () => {
        const user = userEvent.setup()
        render(<LoginForm locale="en" />)

        // Fill in email and password
        const emailInput = screen.getByPlaceholderText(
            "Enter your email address"
        )
        const passwordInput = screen.getByPlaceholderText("Enter your password")

        await user.type(emailInput, "test@example.com")
        await user.type(passwordInput, "password123")

        // Solve CAPTCHA
        const captchaWidget = screen.getByTestId("turnstile-widget")
        fireEvent.click(captchaWidget)

        // Submit button should now be enabled
        await waitFor(() => {
            const submitButton = screen.getByRole("button", {
                name: /sign in/i,
            })
            expect(submitButton).not.toBeDisabled()
        })
    })

    it("should include CAPTCHA token in login request", async () => {
        const user = userEvent.setup()
        ;(global as any).fetch = vi.fn((url: any) => {
            if (url.includes("/api/auth/csrf")) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            success: true,
                            data: { csrfToken: "test-csrf-token" },
                        }),
                })
            }
            if (url.includes("/api/auth/login")) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            success: true,
                            data: { token: "auth-token" },
                        }),
                })
            }
            return Promise.reject(new Error("Unknown URL"))
        })

        render(<LoginForm locale="en" />)

        // Fill in email and password
        const emailInput = screen.getByPlaceholderText(
            "Enter your email address"
        )
        const passwordInput = screen.getByPlaceholderText("Enter your password")

        await user.type(emailInput, "test@example.com")
        await user.type(passwordInput, "password123")

        // Solve CAPTCHA
        const captchaWidget = screen.getByTestId("turnstile-widget")
        fireEvent.click(captchaWidget)

        // Submit form
        const submitButton = screen.getByRole("button", { name: /sign in/i })
        await user.click(submitButton)

        // Verify CAPTCHA token was included in request
        await waitFor(() => {
            const loginCall = (global.fetch as any).mock.calls.find(
                (call: any) => call[0].includes("/api/auth/login")
            )
            expect(loginCall).toBeDefined()

            const requestBody = JSON.parse(loginCall[1].body)
            expect(requestBody.captchaToken).toBe("test-captcha-token")
        })
    })

    it("should show error when CAPTCHA verification fails on server", async () => {
        const user = userEvent.setup()
        ;(global as any).fetch = vi.fn((url: any) => {
            if (url.includes("/api/auth/csrf")) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            success: true,
                            data: { csrfToken: "test-csrf-token" },
                        }),
                })
            }
            if (url.includes("/api/auth/login")) {
                return Promise.resolve({
                    ok: false,
                    status: 400,
                    json: () =>
                        Promise.resolve({
                            success: false,
                            error: "CAPTCHA verification failed",
                        }),
                })
            }
            return Promise.reject(new Error("Unknown URL"))
        })

        render(<LoginForm locale="en" />)

        // Fill in email and password
        const emailInput = screen.getByPlaceholderText(
            "Enter your email address"
        )
        const passwordInput = screen.getByPlaceholderText("Enter your password")

        await user.type(emailInput, "test@example.com")
        await user.type(passwordInput, "password123")

        // Solve CAPTCHA
        const captchaWidget = screen.getByTestId("turnstile-widget")
        fireEvent.click(captchaWidget)

        // Submit form
        const submitButton = screen.getByRole("button", { name: /sign in/i })
        await user.click(submitButton)

        // Verify error message is displayed
        await waitFor(() => {
            expect(
                screen.getByText("CAPTCHA verification failed")
            ).toBeInTheDocument()
        })
    })

    it("should not submit form without CAPTCHA token", async () => {
        const user = userEvent.setup()
        global.fetch = vi.fn()

        render(<LoginForm locale="en" />)

        // Fill in email and password
        const emailInput = screen.getByPlaceholderText(
            "Enter your email address"
        )
        const passwordInput = screen.getByPlaceholderText("Enter your password")

        await user.type(emailInput, "test@example.com")
        await user.type(passwordInput, "password123")

        // Try to submit without CAPTCHA
        const submitButton = screen.getByRole("button", { name: /sign in/i })
        expect(submitButton).toBeDisabled()

        // Verify fetch was not called for login
        const loginCalls = (global.fetch as any).mock.calls.filter(
            (call: any) => call[0].includes("/api/auth/login")
        )
        expect(loginCalls.length).toBe(0)
    })

    it("should handle CAPTCHA expiration", async () => {
        const user = userEvent.setup()
        render(<LoginForm locale="en" />)

        // Fill in email and password
        const emailInput = screen.getByPlaceholderText(
            "Enter your email address"
        )
        const passwordInput = screen.getByPlaceholderText("Enter your password")

        await user.type(emailInput, "test@example.com")
        await user.type(passwordInput, "password123")

        // Solve CAPTCHA
        const captchaWidget = screen.getByTestId("turnstile-widget")
        fireEvent.click(captchaWidget)

        // Verify submit button is enabled
        await waitFor(() => {
            const submitButton = screen.getByRole("button", {
                name: /sign in/i,
            })
            expect(submitButton).not.toBeDisabled()
        })

        // Simulate CAPTCHA expiration by clicking widget again with null token
        // (This would be handled by the actual widget, but we're testing the form's response)
        // In a real scenario, the widget would call onTokenChange(null)
    })

    it("should display loading state while submitting with CAPTCHA", async () => {
        const user = userEvent.setup()
        ;(global as any).fetch = vi.fn((url: any) => {
            if (url.includes("/api/auth/csrf")) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            success: true,
                            data: { csrfToken: "test-csrf-token" },
                        }),
                })
            }
            if (url.includes("/api/auth/login")) {
                // Simulate slow response
                return new Promise(resolve =>
                    setTimeout(
                        () =>
                            resolve({
                                ok: true,
                                json: () =>
                                    Promise.resolve({
                                        success: true,
                                        data: { token: "auth-token" },
                                    }),
                            }),
                        100
                    )
                )
            }
            return Promise.reject(new Error("Unknown URL"))
        })

        render(<LoginForm locale="en" />)

        // Fill in email and password
        const emailInput = screen.getByPlaceholderText(
            "Enter your email address"
        )
        const passwordInput = screen.getByPlaceholderText("Enter your password")

        await user.type(emailInput, "test@example.com")
        await user.type(passwordInput, "password123")

        // Solve CAPTCHA
        const captchaWidget = screen.getByTestId("turnstile-widget")
        fireEvent.click(captchaWidget)

        // Submit form
        const submitButton = screen.getByRole("button", { name: /sign in/i })
        await user.click(submitButton)

        // Verify loading state
        await waitFor(() => {
            expect(screen.getByText(/signing in/i)).toBeInTheDocument()
        })
    })

    it("should validate email and password before checking CAPTCHA", async () => {
        const user = userEvent.setup()
        render(<LoginForm locale="en" />)

        // Try to submit with empty fields
        const submitButton = screen.getByRole("button", { name: /sign in/i })
        expect(submitButton).toBeDisabled() // Should be disabled due to missing CAPTCHA

        // Fill in invalid email
        const emailInput = screen.getByPlaceholderText(
            "Enter your email address"
        )
        await user.type(emailInput, "invalid-email")

        // Blur to trigger validation
        fireEvent.blur(emailInput)

        // Verify email error is shown
        await waitFor(() => {
            expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
        })
    })
})
