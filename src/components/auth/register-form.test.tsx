/**
 * RegisterForm Component Tests
 * Tests real-time validation, password strength indicator, and form submission
 * Validates: Requirements 1.1, 1.2, 1.3, 1.5, 1.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RegisterForm } from "./register-form"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

// Mock fetch
global.fetch = vi.fn()

describe("RegisterForm", () => {
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
            render(<RegisterForm locale="en" />)

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
            render(<RegisterForm locale="en" />)

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

    describe("Real-time Password Strength Validation (Requirement 8.2)", () => {
        it("should display password strength indicator", async () => {
            const user = userEvent.setup()
            render(<RegisterForm locale="en" />)

            const passwordInput = screen.getByLabelText(/^password$/i)

            // Type weak password
            await user.type(passwordInput, "weak")

            await waitFor(() => {
                expect(screen.getByText(/too weak/i)).toBeInTheDocument()
            })

            // Type strong password
            await user.clear(passwordInput)
            await user.type(passwordInput, "StrongPass123!")

            await waitFor(() => {
                expect(screen.getByText(/strong password/i)).toBeInTheDocument()
            })
        })

        it("should show missing requirements for password", async () => {
            const user = userEvent.setup()
            render(<RegisterForm locale="en" />)

            const passwordInput = screen.getByLabelText(/^password$/i)

            await user.type(passwordInput, "weak")

            await waitFor(() => {
                expect(
                    screen.getByText(/missing requirements/i)
                ).toBeInTheDocument()
                expect(
                    screen.getByText(/at least 8 characters/i)
                ).toBeInTheDocument()
            })
        })

        it("should validate password meets requirements", async () => {
            const user = userEvent.setup()
            render(<RegisterForm locale="en" />)

            const passwordInput = screen.getByLabelText(/^password$/i)

            // Type password without uppercase
            await user.type(passwordInput, "weakpass123!")
            await user.tab()

            await waitFor(() => {
                expect(
                    screen.getByText(
                        /must contain at least one uppercase letter/i
                    )
                ).toBeInTheDocument()
            })
        })
    })

    describe("Password Confirmation Matching (Requirement 8.3)", () => {
        it("should validate password confirmation matches in real-time", async () => {
            const user = userEvent.setup()
            render(<RegisterForm locale="en" />)

            const passwordInput = screen.getByLabelText(/^password$/i)
            const confirmPasswordInput =
                screen.getByLabelText(/confirm password/i)

            await user.type(passwordInput, "ValidPass123!")
            await user.type(confirmPasswordInput, "DifferentPass123!")
            await user.tab()

            await waitFor(() => {
                expect(
                    screen.getByText(/passwords do not match/i)
                ).toBeInTheDocument()
            })

            // Fix the mismatch
            await user.clear(confirmPasswordInput)
            await user.type(confirmPasswordInput, "ValidPass123!")

            await waitFor(() => {
                expect(
                    screen.queryByText(/passwords do not match/i)
                ).not.toBeInTheDocument()
            })
        })
    })

    describe("Name Field Validation (Requirement 8.4)", () => {
        it("should validate name format in real-time", async () => {
            const user = userEvent.setup()
            render(<RegisterForm locale="en" />)

            const nameInput = screen.getByLabelText(/name/i)

            // Type invalid name with special characters
            await user.type(nameInput, "John@Doe")
            await user.tab()

            await waitFor(() => {
                expect(
                    screen.getByText(/name contains invalid characters/i)
                ).toBeInTheDocument()
            })

            // Type valid name
            await user.clear(nameInput)
            await user.type(nameInput, "John Doe")

            await waitFor(() => {
                expect(
                    screen.queryByText(/name contains invalid characters/i)
                ).not.toBeInTheDocument()
            })
        })

        it("should accept names with hyphens and apostrophes", async () => {
            const user = userEvent.setup()
            render(<RegisterForm locale="en" />)

            const nameInput = screen.getByLabelText(/name/i)

            await user.type(nameInput, "Mary-Jane O'Brien")
            await user.tab()

            await waitFor(() => {
                expect(
                    screen.queryByText(/name contains invalid characters/i)
                ).not.toBeInTheDocument()
            })
        })
    })

    describe("Validation Errors Display (Requirement 8.5)", () => {
        it("should display validation errors below each field", async () => {
            const user = userEvent.setup()
            render(<RegisterForm locale="en" />)

            const nameInput = screen.getByLabelText(/name/i)
            const emailInput = screen.getByLabelText(/email/i)

            // Trigger validation errors
            await user.click(nameInput)
            await user.tab()
            await user.click(emailInput)
            await user.tab()

            await waitFor(() => {
                expect(
                    screen.getByText(/name is required/i)
                ).toBeInTheDocument()
                expect(
                    screen.getByText(/email is required/i)
                ).toBeInTheDocument()
            })
        })
    })

    describe("Clear Errors on Correction (Requirement 8.6)", () => {
        it("should clear error message when user corrects invalid field", async () => {
            const user = userEvent.setup()
            render(<RegisterForm locale="en" />)

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

    describe("Form Submission (Requirement 1.1, 1.5, 1.7)", () => {
        it("should submit form with valid data", async () => {
            const user = userEvent.setup()

            // Mock successful registration
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: { userId: "123", email: "john@example.com" },
                }),
            })

            render(<RegisterForm locale="en" />)

            // Fill in valid data
            await user.type(screen.getByLabelText(/name/i), "John Doe")
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(
                screen.getByLabelText(/^password$/i),
                "ValidPass123!"
            )
            await user.type(
                screen.getByLabelText(/confirm password/i),
                "ValidPass123!"
            )

            // Submit form
            await user.click(
                screen.getByRole("button", { name: /create account/i })
            )

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    "/api/auth/register",
                    expect.objectContaining({
                        method: "POST",
                        headers: expect.objectContaining({
                            "Content-Type": "application/json",
                            "X-CSRF-Token": "test-csrf-token",
                        }),
                    })
                )
            })

            // Should redirect to verification pending page
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith(
                    "/en/auth/verify-email-pending"
                )
            })
        })

        it("should not submit form with invalid data", async () => {
            const user = userEvent.setup()
            render(<RegisterForm locale="en" />)

            // Fill in invalid data
            await user.type(screen.getByLabelText(/name/i), "John@Doe")
            await user.type(screen.getByLabelText(/email/i), "invalid-email")
            await user.type(screen.getByLabelText(/^password$/i), "weak")
            await user.type(
                screen.getByLabelText(/confirm password/i),
                "different"
            )

            // Submit form
            await user.click(
                screen.getByRole("button", { name: /create account/i })
            )

            // Should show validation errors
            await waitFor(() => {
                expect(
                    screen.getByText(/name contains invalid characters/i)
                ).toBeInTheDocument()
                expect(
                    screen.getByText(/invalid email format/i)
                ).toBeInTheDocument()
            })

            // Should not call API
            expect(global.fetch).toHaveBeenCalledTimes(1) // Only CSRF token fetch
        })

        it("should display server error on registration failure", async () => {
            const user = userEvent.setup()

            // Mock failed registration
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    success: false,
                    error: "Email already registered",
                }),
            })

            render(<RegisterForm locale="en" />)

            // Fill in valid data
            await user.type(screen.getByLabelText(/name/i), "John Doe")
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(
                screen.getByLabelText(/^password$/i),
                "ValidPass123!"
            )
            await user.type(
                screen.getByLabelText(/confirm password/i),
                "ValidPass123!"
            )

            // Submit form
            await user.click(
                screen.getByRole("button", { name: /create account/i })
            )

            await waitFor(() => {
                expect(
                    screen.getByText(/email already registered/i)
                ).toBeInTheDocument()
            })
        })
    })

    describe("Loading State", () => {
        it("should disable form during submission", async () => {
            const user = userEvent.setup()

            // Mock slow registration
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
                                        },
                                    }),
                                }),
                            100
                        )
                    )
            )

            render(<RegisterForm locale="en" />)

            // Fill in valid data
            await user.type(screen.getByLabelText(/name/i), "John Doe")
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(
                screen.getByLabelText(/^password$/i),
                "ValidPass123!"
            )
            await user.type(
                screen.getByLabelText(/confirm password/i),
                "ValidPass123!"
            )

            // Submit form
            await user.click(
                screen.getByRole("button", { name: /create account/i })
            )

            // Button should show loading state
            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: /creating account/i })
                ).toBeDisabled()
            })
        })
    })

    describe("CSRF Token", () => {
        it("should include CSRF token in form submission", async () => {
            const user = userEvent.setup()

            // Mock successful registration
            ;(global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: { userId: "123", email: "john@example.com" },
                }),
            })

            render(<RegisterForm locale="en" />)

            // Fill in valid data
            await user.type(screen.getByLabelText(/name/i), "John Doe")
            await user.type(screen.getByLabelText(/email/i), "john@example.com")
            await user.type(
                screen.getByLabelText(/^password$/i),
                "ValidPass123!"
            )
            await user.type(
                screen.getByLabelText(/confirm password/i),
                "ValidPass123!"
            )

            // Submit form
            await user.click(
                screen.getByRole("button", { name: /create account/i })
            )

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    "/api/auth/register",
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
})
