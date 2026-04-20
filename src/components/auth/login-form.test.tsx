/**
 * LoginForm Component Tests
 * Tests real-time validation, remember me functionality, and form submission
 * Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LoginForm } from "./login-form"

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
    }),
}))

// Mock fetch
global.fetch = vi.fn()

describe("LoginForm", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock CSRF token fetch
        ;(global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: { csrfToken: "test-csrf-token" },
            }),
        })
    })

    describe("Real-time Email Validation (Requirement 8.1)", () => {
        it("should validate email format in real-time", async () => {
            const user = userEvent.setup()
            render(<LoginForm locale="en" />)

            const emailInput = screen.getByLabelText(/email/i)

            // Type invalid email
            await user.type(emailInput, "invalid-email")
            await user.tab() // Blur to trigger validation

            await waitFor(() => {
                expect(
                    screen.getByText(/invalid email format/i)
                ).toBeInTheDocument()
            })

            // Clear and type valid email
            await user.clear(emailInput)
            await user.type(emailInput, "valid@example.com")

            await waitFor(() => {
                expect(
                    screen.queryByText(/invalid email format/i)
                ).not.toBeInTheDocument()
            })
        })

        it("should show error for empty email on blur", async () => {
            const user = userEvent.setup()
            render(<LoginForm locale="en" />)

            const emailInput = screen.getByLabelText(/email/i)

            await user.click(emailInput)
            await user.tab() // Blur without typing

            await waitFor(() => {
                expect(
                    screen.getByText(/email is required/i)
                ).toBeInTheDocument()
            })
        })
    })

    describe("Password Field Validation (Requirement 3.2)", () => {
        it("should show error for empty password on blur", async () => {
            const user = userEvent.setup()
            render(<LoginForm locale="en" />)

            const passwordInput = screen.getByLabelText(/password/i)

            await user.click(passwordInput)
            await user.tab() // Blur without typing

            await waitFor(() => {
                expect(
                    screen.getByText(/password is required/i)
                ).toBeInTheDocument()
            })
        })

        it("should clear password error when user types", async () => {
            const user = userEvent.setup()
            render(<LoginForm locale="en" />)

            const passwordInput = screen.getByLabelText(/password/i)

            // Trigger error
            await user.click(passwordInput)
            await user.tab()

            await waitFor(() => {
                expect(
                    screen.getByText(/password is required/i)
                ).toBeInTheDocument()
            })

            // Type password
            await user.type(passwordInput, "anypassword")

            await waitFor(() => {
                expect(
                    screen.queryByText(/password is required/i)
                ).not.toBeInTheDocument()
            })
        })
    })

    describe("Remember Me Checkbox (Requirement 3.9)", () => {
        it("should toggle remember me checkbox", async () => {
            const user = userEvent.setup()
            render(<LoginForm locale="en" />)

            const rememberMeCheckbox = screen.getByRole("checkbox", {
                name: /remember me/i,
            })

            // Initially unchecked
            expect(rememberMeCheckbox).not.toBeChecked()

            // Click to check
            await user.click(rememberMeCheckbox)
            expect(rememberMeCheckbox).toBeChecked()

            // Click to uncheck
            await user.click(rememberMeCheckbox)
            expect(rememberMeCheckbox).not.toBeChecked()
        })

        it("should include rememberMe in form submission", async () => {
            const user = userEvent.setup()

            // Mock successful login
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        userId: "123",
                        email: "john@example.com",
                        name: "John Doe",
                    },
                }),
            })

            render(<LoginForm locale="en" />)

            // Fill in credentials
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(screen.getByLabelText(/password/i), "ValidPass123!")

            // Check remember me
            await user.click(
                screen.getByRole("checkbox", { name: /remember me/i })
            )

            // Submit form
            await user.click(screen.getByRole("button", { name: /sign in/i }))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    "/api/auth/login",
                    expect.objectContaining({
                        body: expect.stringContaining('"rememberMe":true'),
                    })
                )
            })
        })
    })

    describe("Form Submission (Requirement 3.1, 3.5, 3.6)", () => {
        it("should submit form with valid credentials", async () => {
            const user = userEvent.setup()

            // Mock successful login
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        userId: "123",
                        email: "john@example.com",
                        name: "John Doe",
                    },
                }),
            })

            render(<LoginForm locale="en" />)

            // Fill in valid credentials
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(screen.getByLabelText(/password/i), "ValidPass123!")

            // Submit form
            await user.click(screen.getByRole("button", { name: /sign in/i }))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    "/api/auth/login",
                    expect.objectContaining({
                        method: "POST",
                        headers: expect.objectContaining({
                            "Content-Type": "application/json",
                            "X-CSRF-Token": "test-csrf-token",
                        }),
                    })
                )
            })

            // Should redirect to dashboard
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/en/dashboard")
                expect(mockRefresh).toHaveBeenCalled()
            })
        })

        it("should not submit form with invalid email", async () => {
            const user = userEvent.setup()
            render(<LoginForm locale="en" />)

            // Fill in invalid email
            await user.type(screen.getByLabelText(/email/i), "invalid-email")
            await user.type(screen.getByLabelText(/password/i), "ValidPass123!")

            // Submit form
            await user.click(screen.getByRole("button", { name: /sign in/i }))

            // Should show validation error
            await waitFor(() => {
                expect(
                    screen.getByText(/invalid email format/i)
                ).toBeInTheDocument()
            })

            // Should not call API (only CSRF token fetch)
            expect(global.fetch).toHaveBeenCalledTimes(1)
        })

        it("should not submit form with empty password", async () => {
            const user = userEvent.setup()
            render(<LoginForm locale="en" />)

            // Fill in only email
            await user.type(screen.getByLabelText(/email/i), "john@example.com")

            // Blur password field to trigger validation
            const passwordInput = screen.getByLabelText(/password/i)
            await user.click(passwordInput)
            await user.tab()

            // Should show validation error
            await waitFor(() => {
                expect(
                    screen.getByText(/password is required/i)
                ).toBeInTheDocument()
            })

            // Submit form - should not call API due to validation error
            await user.click(screen.getByRole("button", { name: /sign in/i }))

            // Should not call API (only CSRF token fetch)
            expect(global.fetch).toHaveBeenCalledTimes(1)
        })
    })

    describe("Error Handling (Requirement 3.2, 3.7)", () => {
        it("should display generic error for invalid credentials", async () => {
            const user = userEvent.setup()

            // Mock failed login
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({
                    success: false,
                    error: "Invalid email or password",
                }),
            })

            render(<LoginForm locale="en" />)

            // Fill in credentials
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(screen.getByLabelText(/password/i), "WrongPass123!")

            // Submit form
            await user.click(screen.getByRole("button", { name: /sign in/i }))

            await waitFor(() => {
                expect(
                    screen.getByText(/invalid email or password/i)
                ).toBeInTheDocument()
            })
        })

        it("should display rate limiting error", async () => {
            const user = userEvent.setup()

            // Mock rate limiting response
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: async () => ({
                    success: false,
                    error: "Too many login attempts. Please try again later.",
                }),
            })

            render(<LoginForm locale="en" />)

            // Fill in credentials
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(screen.getByLabelText(/password/i), "ValidPass123!")

            // Submit form
            await user.click(screen.getByRole("button", { name: /sign in/i }))

            await waitFor(() => {
                expect(
                    screen.getByText(
                        /too many login attempts\. please try again later/i
                    )
                ).toBeInTheDocument()
            })
        })

        it("should display generic error for server errors", async () => {
            const user = userEvent.setup()

            // Mock server error
            ;(global.fetch as any).mockRejectedValueOnce(
                new Error("Network error")
            )

            render(<LoginForm locale="en" />)

            // Fill in credentials
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(screen.getByLabelText(/password/i), "ValidPass123!")

            // Submit form
            await user.click(screen.getByRole("button", { name: /sign in/i }))

            await waitFor(() => {
                expect(
                    screen.getByText(
                        /an error occurred\. please try again later/i
                    )
                ).toBeInTheDocument()
            })
        })
    })

    describe("Loading State (Requirement 3.8)", () => {
        it("should disable form during submission", async () => {
            const user = userEvent.setup()

            // Mock slow login
            ;(global.fetch as any).mockImplementationOnce(
                () =>
                    new Promise(resolve =>
                        setTimeout(
                            () =>
                                resolve({
                                    ok: true,
                                    json: async () => ({
                                        success: true,
                                        data: {
                                            userId: "123",
                                            email: "john@example.com",
                                            name: "John Doe",
                                        },
                                    }),
                                }),
                            100
                        )
                    )
            )

            render(<LoginForm locale="en" />)

            // Fill in credentials
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(screen.getByLabelText(/password/i), "ValidPass123!")

            // Submit form
            await user.click(screen.getByRole("button", { name: /sign in/i }))

            // Button should show loading state
            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: /signing in/i })
                ).toBeDisabled()
            })

            // Inputs should be disabled
            expect(screen.getByLabelText(/email/i)).toBeDisabled()
            expect(screen.getByLabelText(/password/i)).toBeDisabled()
        })
    })

    describe("CSRF Token (Requirement 6.1)", () => {
        it("should include CSRF token in form submission", async () => {
            const user = userEvent.setup()

            // Mock successful login
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        userId: "123",
                        email: "john@example.com",
                        name: "John Doe",
                    },
                }),
            })

            render(<LoginForm locale="en" />)

            // Fill in credentials
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(screen.getByLabelText(/password/i), "ValidPass123!")

            // Submit form
            await user.click(screen.getByRole("button", { name: /sign in/i }))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    "/api/auth/login",
                    expect.objectContaining({
                        headers: expect.objectContaining({
                            "X-CSRF-Token": "test-csrf-token",
                        }),
                        body: expect.stringContaining("test-csrf-token"),
                    })
                )
            })
        })
    })

    describe("Validation Errors Display (Requirement 8.5)", () => {
        it("should display validation errors below each field", async () => {
            const user = userEvent.setup()
            render(<LoginForm locale="en" />)

            const emailInput = screen.getByLabelText(/email/i)
            const passwordInput = screen.getByLabelText(/password/i)

            // Trigger validation errors
            await user.click(emailInput)
            await user.tab()
            await user.click(passwordInput)
            await user.tab()

            await waitFor(() => {
                expect(
                    screen.getByText(/email is required/i)
                ).toBeInTheDocument()
                expect(
                    screen.getByText(/password is required/i)
                ).toBeInTheDocument()
            })
        })
    })

    describe("Clear Errors on Correction (Requirement 8.6)", () => {
        it("should clear error message when user corrects invalid field", async () => {
            const user = userEvent.setup()
            render(<LoginForm locale="en" />)

            const emailInput = screen.getByLabelText(/email/i)

            // Type invalid email
            await user.type(emailInput, "invalid")
            await user.tab()

            await waitFor(() => {
                expect(
                    screen.getByText(/invalid email format/i)
                ).toBeInTheDocument()
            })

            // Correct the email
            await user.clear(emailInput)
            await user.type(emailInput, "valid@example.com")

            await waitFor(() => {
                expect(
                    screen.queryByText(/invalid email format/i)
                ).not.toBeInTheDocument()
            })
        })
    })
})
