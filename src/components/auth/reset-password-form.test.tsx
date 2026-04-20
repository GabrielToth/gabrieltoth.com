/**
 * ResetPasswordForm Component Tests
 * Tests password validation, confirmation matching, and form submission
 * Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ResetPasswordForm } from "./reset-password-form"

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
        refresh: mockRefresh,
    }),
}))

global.fetch = vi.fn()

describe("ResetPasswordForm", () => {
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
        it("should validate password strength in real-time", async () => {
            const user = userEvent.setup()
            render(<ResetPasswordForm locale="en" token="test-token" />)

            const passwordInput = screen.getByLabelText(/^new password$/i)

            // Type weak password
            await user.type(passwordInput, "weak")
            await user.tab() // Blur the field

            // Should show error
            await waitFor(() => {
                expect(
                    screen.getByText(/password must be at least 8 characters/i)
                ).toBeInTheDocument()
            })

            // Clear and type strong password
            await user.clear(passwordInput)
            await user.type(passwordInput, "StrongPass123!")

            // Error should clear
            await waitFor(() => {
                expect(
                    screen.queryByText(
                        /password must be at least 8 characters/i
                    )
                ).not.toBeInTheDocument()
            })
        })

        it("should validate password confirmation matches in real-time", async () => {
            const user = userEvent.setup()
            render(<ResetPasswordForm locale="en" token="test-token" />)

            const passwordInput = screen.getByLabelText(/^new password$/i)
            const confirmPasswordInput =
                screen.getByLabelText(/confirm new password/i)

            // Type password
            await user.type(passwordInput, "StrongPass123!")

            // Type non-matching confirmation
            await user.type(confirmPasswordInput, "DifferentPass123!")
            await user.tab()

            // Should show error
            await waitFor(() => {
                expect(
                    screen.getByText(/passwords do not match/i)
                ).toBeInTheDocument()
            })

            // Clear and type matching password
            await user.clear(confirmPasswordInput)
            await user.type(confirmPasswordInput, "StrongPass123!")

            // Error should clear
            await waitFor(() => {
                expect(
                    screen.queryByText(/passwords do not match/i)
                ).not.toBeInTheDocument()
            })
        })

        it("should show error for password without uppercase", async () => {
            const user = userEvent.setup()
            render(<ResetPasswordForm locale="en" token="test-token" />)

            const passwordInput = screen.getByLabelText(/^new password$/i)

            // Type password without uppercase
            await user.type(passwordInput, "weakpass123!")
            await user.tab()

            // Should show error
            await waitFor(() => {
                expect(
                    screen.getByText(
                        /password must contain at least one uppercase letter/i
                    )
                ).toBeInTheDocument()
            })
        })

        it("should show error for password without special character", async () => {
            const user = userEvent.setup()
            render(<ResetPasswordForm locale="en" token="test-token" />)

            const passwordInput = screen.getByLabelText(/^new password$/i)

            // Type password without special character
            await user.type(passwordInput, "WeakPass123")
            await user.tab()

            // Should show error
            await waitFor(() => {
                expect(
                    screen.getByText(
                        /password must contain at least one special character/i
                    )
                ).toBeInTheDocument()
            })
        })

        it("should clear error when user corrects invalid field", async () => {
            const user = userEvent.setup()
            render(<ResetPasswordForm locale="en" token="test-token" />)

            const passwordInput = screen.getByLabelText(/^new password$/i)

            // Type weak password and blur
            await user.type(passwordInput, "weak")
            await user.tab()

            // Should show error
            await waitFor(() => {
                expect(
                    screen.getByText(/password must be at least 8 characters/i)
                ).toBeInTheDocument()
            })

            // Correct the password
            await user.clear(passwordInput)
            await user.type(passwordInput, "StrongPass123!")

            // Error should clear
            await waitFor(() => {
                expect(
                    screen.queryByText(
                        /password must be at least 8 characters/i
                    )
                ).not.toBeInTheDocument()
            })
        })
    })

    describe("Form Submission", () => {
        it("should submit form with valid data", async () => {
            const user = userEvent.setup()

            // Mock successful password reset
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    message: "Password reset successfully",
                }),
            })

            render(<ResetPasswordForm locale="en" token="test-token" />)

            // Fill in valid passwords
            const passwordInput = screen.getByLabelText(/^new password$/i)
            const confirmPasswordInput =
                screen.getByLabelText(/confirm new password/i)

            await user.type(passwordInput, "StrongPass123!")
            await user.type(confirmPasswordInput, "StrongPass123!")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /reset password/i,
            })
            await user.click(submitButton)

            // Should show success message
            await waitFor(() => {
                expect(
                    screen.getByText(/password reset successfully/i)
                ).toBeInTheDocument()
            })

            // Should redirect to login after delay
            await waitFor(
                () => {
                    expect(mockPush).toHaveBeenCalledWith("/en/login")
                    expect(mockRefresh).toHaveBeenCalled()
                },
                { timeout: 3000 }
            )
        })

        it("should not submit form with weak password", async () => {
            const user = userEvent.setup()
            render(<ResetPasswordForm locale="en" token="test-token" />)

            // Fill in weak password
            const passwordInput = screen.getByLabelText(/^new password$/i)
            const confirmPasswordInput =
                screen.getByLabelText(/confirm new password/i)

            await user.type(passwordInput, "weak")
            await user.type(confirmPasswordInput, "weak")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /reset password/i,
            })
            await user.click(submitButton)

            // Should show validation error
            await waitFor(() => {
                expect(
                    screen.getByText(/password must be at least 8 characters/i)
                ).toBeInTheDocument()
            })

            // Should not call API
            expect(global.fetch).toHaveBeenCalledTimes(1) // Only CSRF token fetch
        })

        it("should not submit form with mismatched passwords", async () => {
            const user = userEvent.setup()
            render(<ResetPasswordForm locale="en" token="test-token" />)

            // Fill in mismatched passwords
            const passwordInput = screen.getByLabelText(/^new password$/i)
            const confirmPasswordInput =
                screen.getByLabelText(/confirm new password/i)

            await user.type(passwordInput, "StrongPass123!")
            await user.type(confirmPasswordInput, "DifferentPass123!")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /reset password/i,
            })
            await user.click(submitButton)

            // Should show validation error
            await waitFor(() => {
                expect(
                    screen.getByText(/passwords do not match/i)
                ).toBeInTheDocument()
            })

            // Should not call API
            expect(global.fetch).toHaveBeenCalledTimes(1) // Only CSRF token fetch
        })

        it("should handle expired token error", async () => {
            const user = userEvent.setup()

            // Mock expired token error
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    success: false,
                    error: "Reset link has expired",
                }),
            })

            render(<ResetPasswordForm locale="en" token="expired-token" />)

            // Fill in valid passwords
            const passwordInput = screen.getByLabelText(/^new password$/i)
            const confirmPasswordInput =
                screen.getByLabelText(/confirm new password/i)

            await user.type(passwordInput, "StrongPass123!")
            await user.type(confirmPasswordInput, "StrongPass123!")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /reset password/i,
            })
            await user.click(submitButton)

            // Should show expired token error
            await waitFor(() => {
                expect(
                    screen.getByText(/reset link has expired/i)
                ).toBeInTheDocument()
            })
        })

        it("should handle invalid token error", async () => {
            const user = userEvent.setup()

            // Mock invalid token error
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    success: false,
                    error: "Invalid reset link",
                }),
            })

            render(<ResetPasswordForm locale="en" token="invalid-token" />)

            // Fill in valid passwords
            const passwordInput = screen.getByLabelText(/^new password$/i)
            const confirmPasswordInput =
                screen.getByLabelText(/confirm new password/i)

            await user.type(passwordInput, "StrongPass123!")
            await user.type(confirmPasswordInput, "StrongPass123!")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /reset password/i,
            })
            await user.click(submitButton)

            // Should show invalid token error
            await waitFor(() => {
                expect(
                    screen.getByText(/invalid reset link/i)
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

            render(<ResetPasswordForm locale="en" token="test-token" />)

            // Fill in valid passwords
            const passwordInput = screen.getByLabelText(/^new password$/i)
            const confirmPasswordInput =
                screen.getByLabelText(/confirm new password/i)

            await user.type(passwordInput, "StrongPass123!")
            await user.type(confirmPasswordInput, "StrongPass123!")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /reset password/i,
            })
            await user.click(submitButton)

            // Button should be disabled and show loading text
            await waitFor(() => {
                expect(submitButton).toBeDisabled()
                expect(screen.getByText(/resetting/i)).toBeInTheDocument()
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

            render(<ResetPasswordForm locale="en" token="test-token" />)

            // Fill in valid passwords
            const passwordInput = screen.getByLabelText(/^new password$/i)
            const confirmPasswordInput =
                screen.getByLabelText(/confirm new password/i)

            await user.type(passwordInput, "StrongPass123!")
            await user.type(confirmPasswordInput, "StrongPass123!")

            // Submit form
            const submitButton = screen.getByRole("button", {
                name: /reset password/i,
            })
            await user.click(submitButton)

            // Should include CSRF token in request
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    "/api/auth/reset-password",
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
        it("should display validation errors below each field", async () => {
            const user = userEvent.setup()
            render(<ResetPasswordForm locale="en" token="test-token" />)

            const passwordInput = screen.getByLabelText(/^new password$/i)
            const confirmPasswordInput =
                screen.getByLabelText(/confirm new password/i)

            // Type weak password and blur
            await user.type(passwordInput, "weak")
            await user.tab()

            // Type non-matching confirmation and blur
            await user.type(confirmPasswordInput, "different")
            await user.tab()

            // Both errors should be displayed
            await waitFor(() => {
                expect(
                    screen.getByText(/password must be at least 8 characters/i)
                ).toBeInTheDocument()
                expect(
                    screen.getByText(/passwords do not match/i)
                ).toBeInTheDocument()
            })

            // Errors should have correct styling
            const errors = screen.getAllByRole("alert")
            errors.forEach(error => {
                expect(error).toHaveClass("text-red-600")
            })
        })
    })
})
