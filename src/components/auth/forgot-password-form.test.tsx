/**
 * ForgotPasswordForm Component Tests
 * Tests email validation and form submission
 * Validates: Requirements 5.1, 5.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ForgotPasswordForm } from "./forgot-password-form"

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
    }),
}))

global.fetch = vi.fn()

describe("ForgotPasswordForm", () => {
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

    describe("Real-time Validation", () => {
        it("should validate email format in real-time", async () => {
            const user = userEvent.setup()
            render(<ForgotPasswordForm locale="en" />)

            const emailInput = screen.getByLabelText(/email/i)

            // Type invalid email
            await user.type(emailInput, "invalid-email")
            await user.tab() // Blur the field

            // Should show error
            await waitFor(() => {
                expect(
                    screen.getByText(/invalid email format/i)
                ).toBeInTheDocument()
            })

            // Clear and type valid email
            await user.clear(emailInput)
            await user.type(emailInput, "valid@example.com")

            // Error should clear
            await waitFor(() => {
                expect(
                    screen.queryByText(/invalid email format/i)
                ).not.toBeInTheDocument()
            })
        })

        it("should show error for empty email on blur", async () => {
            const user = userEvent.setup()
            render(<ForgotPasswordForm locale="en" />)

            const emailInput = screen.getByLabelText(/email/i)

            // Focus and blur without typing
            await user.click(emailInput)
            await user.tab()

            // Should show error
            await waitFor(() => {
                expect(
                    screen.getByText(/email is required/i)
                ).toBeInTheDocument()
            })
        })

        it("should clear error when user corrects invalid field", async () => {
            const user = userEvent.setup()
            render(<ForgotPasswordForm locale="en" />)

            const emailInput = screen.getByLabelText(/email/i)

            // Type invalid email and blur
            await user.type(emailInput, "invalid")
            await user.tab()

            // Should show error
            await waitFor(() => {
                expect(
                    screen.getByText(/invalid email format/i)
                ).toBeInTheDocument()
            })

            // Correct the email
            await user.clear(emailInput)
            await user.type(emailInput, "valid@example.com")

            // Error should clear
            await waitFor(() => {
                expect(
                    screen.queryByText(/invalid email format/i)
                ).not.toBeInTheDocument()
            })
        })
    })

    describe("Form Submission", () => {
        it("should submit form with valid email", async () => {
            const user = userEvent.setup()

            // Mock successful forgot password request
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    message:
                        "If an account exists with this email, a reset link has been sent",
                }),
            })

            render(<ForgotPasswordForm locale="en" />)

            // Fill in valid email
            const emailInput = screen.getByLabelText(/email/i)
            await user.type(emailInput, "test@example.com")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /send reset link/i,
            })
            await user.click(submitButton)

            // Should show success message
            await waitFor(() => {
                expect(
                    screen.getByText(/check your email/i)
                ).toBeInTheDocument()
            })

            // Should show generic message
            expect(
                screen.getByText(/if an account exists with this email/i)
            ).toBeInTheDocument()
        })

        it("should not submit form with invalid email", async () => {
            const user = userEvent.setup()
            render(<ForgotPasswordForm locale="en" />)

            // Fill in invalid email
            const emailInput = screen.getByLabelText(/email/i)
            await user.type(emailInput, "invalid-email")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /send reset link/i,
            })
            await user.click(submitButton)

            // Should show validation error
            await waitFor(() => {
                expect(
                    screen.getByText(/invalid email format/i)
                ).toBeInTheDocument()
            })

            // Should not call API
            expect(global.fetch).toHaveBeenCalledTimes(1) // Only CSRF token fetch
        })

        it("should display generic success message regardless of email existence", async () => {
            const user = userEvent.setup()

            // Mock successful response (same for existing and non-existing emails)
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    message:
                        "If an account exists with this email, a reset link has been sent",
                }),
            })

            render(<ForgotPasswordForm locale="en" />)

            // Fill in email
            const emailInput = screen.getByLabelText(/email/i)
            await user.type(emailInput, "nonexistent@example.com")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /send reset link/i,
            })
            await user.click(submitButton)

            // Should show generic success message (Requirement 5.3)
            await waitFor(() => {
                expect(
                    screen.getByText(/if an account exists with this email/i)
                ).toBeInTheDocument()
            })
        })

        it("should handle server error", async () => {
            const user = userEvent.setup()

            // Mock server error
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    success: false,
                    error: "Server error occurred",
                }),
            })

            render(<ForgotPasswordForm locale="en" />)

            // Fill in valid email
            const emailInput = screen.getByLabelText(/email/i)
            await user.type(emailInput, "test@example.com")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /send reset link/i,
            })
            await user.click(submitButton)

            // Should show error message
            await waitFor(() => {
                expect(
                    screen.getByText(/server error occurred/i)
                ).toBeInTheDocument()
            })
        })

        it("should disable submit button while loading", async () => {
            const user = userEvent.setup()

            // Mock delayed response
            ;(global.fetch as any).mockImplementationOnce(
                () =>
                    new Promise(resolve =>
                        setTimeout(
                            () =>
                                resolve({
                                    ok: true,
                                    json: async () => ({
                                        success: true,
                                    }),
                                }),
                            100
                        )
                    )
            )

            render(<ForgotPasswordForm locale="en" />)

            // Fill in valid email
            const emailInput = screen.getByLabelText(/email/i)
            await user.type(emailInput, "test@example.com")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /send reset link/i,
            })
            await user.click(submitButton)

            // Button should be disabled and show loading text
            await waitFor(() => {
                expect(submitButton).toBeDisabled()
                expect(screen.getByText(/sending/i)).toBeInTheDocument()
            })
        })

        it("should include CSRF token in request", async () => {
            const user = userEvent.setup()

            // Mock successful request
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                }),
            })

            render(<ForgotPasswordForm locale="en" />)

            // Fill in valid email
            const emailInput = screen.getByLabelText(/email/i)
            await user.type(emailInput, "test@example.com")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /send reset link/i,
            })
            await user.click(submitButton)

            // Should include CSRF token in request
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    "/api/auth/forgot-password",
                    expect.objectContaining({
                        method: "POST",
                        headers: expect.objectContaining({
                            "X-CSRF-Token": "test-csrf-token",
                        }),
                    })
                )
            })
        })
    })

    describe("Error Display", () => {
        it("should display validation errors below email field", async () => {
            const user = userEvent.setup()
            render(<ForgotPasswordForm locale="en" />)

            const emailInput = screen.getByLabelText(/email/i)

            // Type invalid email and blur
            await user.type(emailInput, "invalid")
            await user.tab()

            // Error should be below the field
            const errorElement = screen.getByText(/invalid email format/i)
            expect(errorElement).toBeInTheDocument()
            expect(errorElement).toHaveClass("text-red-600")
        })
    })
})
