import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RegisterForm } from "./register-form"

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
    }),
}))

// Mock TurnstileWidget
vi.mock("./turnstile-widget", async () => {
    const { useEffect } = await import("react")
    return {
        default: ({
            onTokenChange,
        }: {
            onTokenChange: (token: string | null) => void
        }) => {
            useEffect(() => {
                onTokenChange("test-captcha-token")
            }, [])
            return (
                <div
                    data-testid="turnstile-widget"
                    onClick={() => onTokenChange("test-captcha-token")}
                >
                    Mock CAPTCHA Widget
                </div>
            )
        },
    }
})

describe("RegisterForm with CAPTCHA Integration", () => {
    beforeEach(() => {
        // Mock fetch for CSRF token
        global.fetch = vi.fn((url: string) => {
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
        render(<RegisterForm locale="en" />)

        await waitFor(() => {
            expect(screen.getByTestId("turnstile-widget")).toBeInTheDocument()
        })
    })

    it("should require CAPTCHA token before submission", async () => {
        const user = userEvent.setup()
        render(<RegisterForm locale="en" />)

        // Fill in all fields except CAPTCHA
        const nameInput = screen.getByDisplayValue("")
        const inputs = screen.getAllByRole("textbox")
        const emailInput = inputs.find(
            input => (input as HTMLInputElement).type === "email"
        ) as HTMLInputElement
        const passwordInputs = screen.getAllByDisplayValue("")

        // Find password inputs
        const allInputs = screen.getAllByRole("textbox")
        const passwordInput = allInputs[2] // Assuming password is 3rd input

        await user.type(nameInput, "John Doe")
        await user.type(emailInput, "test@example.com")

        // Try to submit without CAPTCHA
        const submitButton = screen.getByRole("button", {
            name: /create account/i,
        })
        expect(submitButton).toBeDisabled() // Should be disabled without CAPTCHA token
    })

    it("should enable submit button after CAPTCHA is solved", async () => {
        const user = userEvent.setup()
        render(<RegisterForm locale="en" />)

        // Get all inputs
        const inputs = screen.getAllByRole("textbox")

        // Fill in name
        await user.type(inputs[0], "John Doe")

        // Fill in email
        await user.type(inputs[1], "test@example.com")

        // Fill in password (assuming it's a password input)
        const passwordInputs = screen.getAllByDisplayValue("")
        if (passwordInputs.length > 0) {
            await user.type(passwordInputs[0], "Password123!")
        }

        // Solve CAPTCHA
        const captchaWidget = screen.getByTestId("turnstile-widget")
        fireEvent.click(captchaWidget)

        // Submit button should now be enabled
        await waitFor(() => {
            const submitButton = screen.getByRole("button", {
                name: /create account/i,
            })
            expect(submitButton).not.toBeDisabled()
        })
    })

    it("should include CAPTCHA token in registration request", async () => {
        const user = userEvent.setup()
        global.fetch = vi.fn((url: string) => {
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
            if (url.includes("/api/auth/register")) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            success: true,
                            data: { userId: "user-123" },
                        }),
                })
            }
            return Promise.reject(new Error("Unknown URL"))
        })

        render(<RegisterForm locale="en" />)

        // Get all inputs
        const inputs = screen.getAllByRole("textbox")

        // Fill in name
        await user.type(inputs[0], "John Doe")

        // Fill in email
        await user.type(inputs[1], "test@example.com")

        // Fill in password
        const passwordInputs = screen.getAllByDisplayValue("")
        if (passwordInputs.length > 0) {
            await user.type(passwordInputs[0], "Password123!")
        }

        // Solve CAPTCHA
        const captchaWidget = screen.getByTestId("turnstile-widget")
        fireEvent.click(captchaWidget)

        // Submit form
        const submitButton = screen.getByRole("button", {
            name: /create account/i,
        })
        await user.click(submitButton)

        // Verify CAPTCHA token was included in request
        await waitFor(() => {
            const registerCall = (global.fetch as any).mock.calls.find(
                (call: any) => call[0].includes("/api/auth/register")
            )
            expect(registerCall).toBeDefined()

            const requestBody = JSON.parse(registerCall[1].body)
            expect(requestBody.captchaToken).toBe("test-captcha-token")
        })
    })

    it("should show error when CAPTCHA verification fails on server", async () => {
        const user = userEvent.setup()
        global.fetch = vi.fn((url: string) => {
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
            if (url.includes("/api/auth/register")) {
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

        render(<RegisterForm locale="en" />)

        // Get all inputs
        const inputs = screen.getAllByRole("textbox")

        // Fill in name
        await user.type(inputs[0], "John Doe")

        // Fill in email
        await user.type(inputs[1], "test@example.com")

        // Fill in password
        const passwordInputs = screen.getAllByDisplayValue("")
        if (passwordInputs.length > 0) {
            await user.type(passwordInputs[0], "Password123!")
        }

        // Solve CAPTCHA
        const captchaWidget = screen.getByTestId("turnstile-widget")
        fireEvent.click(captchaWidget)

        // Submit form
        const submitButton = screen.getByRole("button", {
            name: /create account/i,
        })
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

        render(<RegisterForm locale="en" />)

        // Get all inputs
        const inputs = screen.getAllByRole("textbox")

        // Fill in name
        await user.type(inputs[0], "John Doe")

        // Fill in email
        await user.type(inputs[1], "test@example.com")

        // Try to submit without CAPTCHA
        const submitButton = screen.getByRole("button", {
            name: /create account/i,
        })
        expect(submitButton).toBeDisabled()

        // Verify fetch was not called for registration
        const registerCalls = (global.fetch as any).mock.calls.filter(
            (call: any) => call[0].includes("/api/auth/register")
        )
        expect(registerCalls.length).toBe(0)
    })

    it("should validate all fields before checking CAPTCHA", async () => {
        const user = userEvent.setup()
        render(<RegisterForm locale="en" />)

        // Try to submit with empty fields
        const submitButton = screen.getByRole("button", {
            name: /create account/i,
        })
        expect(submitButton).toBeDisabled() // Should be disabled due to missing CAPTCHA

        // Fill in invalid email
        const inputs = screen.getAllByRole("textbox")
        await user.type(inputs[1], "invalid-email")

        // Blur to trigger validation
        fireEvent.blur(inputs[1])

        // Verify email error is shown
        await waitFor(() => {
            expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
        })
    })

    it("should display loading state while submitting with CAPTCHA", async () => {
        const user = userEvent.setup()
        global.fetch = vi.fn((url: string) => {
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
            if (url.includes("/api/auth/register")) {
                // Simulate slow response
                return new Promise(resolve =>
                    setTimeout(
                        () =>
                            resolve({
                                ok: true,
                                json: () =>
                                    Promise.resolve({
                                        success: true,
                                        data: { userId: "user-123" },
                                    }),
                            }),
                        100
                    )
                )
            }
            return Promise.reject(new Error("Unknown URL"))
        })

        render(<RegisterForm locale="en" />)

        // Get all inputs
        const inputs = screen.getAllByRole("textbox")

        // Fill in name
        await user.type(inputs[0], "John Doe")

        // Fill in email
        await user.type(inputs[1], "test@example.com")

        // Fill in password
        const passwordInputs = screen.getAllByDisplayValue("")
        if (passwordInputs.length > 0) {
            await user.type(passwordInputs[0], "Password123!")
        }

        // Solve CAPTCHA
        const captchaWidget = screen.getByTestId("turnstile-widget")
        fireEvent.click(captchaWidget)

        // Submit form
        const submitButton = screen.getByRole("button", {
            name: /create account/i,
        })
        await user.click(submitButton)

        // Verify loading state
        await waitFor(() => {
            expect(screen.getByText(/creating account/i)).toBeInTheDocument()
        })
    })

    it("should handle CAPTCHA expiration", async () => {
        const user = userEvent.setup()
        render(<RegisterForm locale="en" />)

        // Get all inputs
        const inputs = screen.getAllByRole("textbox")

        // Fill in name
        await user.type(inputs[0], "John Doe")

        // Fill in email
        await user.type(inputs[1], "test@example.com")

        // Solve CAPTCHA
        const captchaWidget = screen.getByTestId("turnstile-widget")
        fireEvent.click(captchaWidget)

        // Verify submit button is enabled
        await waitFor(() => {
            const submitButton = screen.getByRole("button", {
                name: /create account/i,
            })
            expect(submitButton).not.toBeDisabled()
        })
    })

    it("should require CAPTCHA for both registration and login flows", async () => {
        render(<RegisterForm locale="en" />)

        // Verify CAPTCHA widget is present
        const captchaWidget = screen.getByTestId("turnstile-widget")
        expect(captchaWidget).toBeInTheDocument()

        // Verify submit button is disabled without CAPTCHA
        const submitButton = screen.getByRole("button", {
            name: /create account/i,
        })
        expect(submitButton).toBeDisabled()
    })
})
