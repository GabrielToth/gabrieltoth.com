/**
 * LoginForm Component Tests
 * Tests real-time validation, remember me functionality, and form submission
 * Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { render, screen, waitFor } from "@testing-library/react"
import React, { useEffect } from "react"
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

// Mock Turnstile (avoid loading Cloudflare script in jsdom)
vi.mock("@/components/auth/turnstile-widget", () => {
    const TurnstileMock = ({
        onTokenChange,
    }: {
        onTokenChange: (token: string | null) => void
    }) => {
        useEffect(() => {
            onTokenChange("test-turnstile-token")
        }, [])
        return <div data-testid="turnstile-mock" />
    }
    return { default: TurnstileMock }
})

// Mock fetch
global.fetch = vi.fn()

const csrfFetchResponse = {
    ok: true,
    json: async () => ({
        success: true,
        data: { csrfToken: "test-csrf-token" },
    }),
}

async function renderReadyLoginForm() {
    render(<LoginForm locale="en" />)
    await waitFor(() =>
        expect(screen.getByTestId("turnstile-mock")).toBeInTheDocument()
    )
}

describe("LoginForm", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ;(global.fetch as any).mockImplementation(async (url: string) => {
            if (String(url).includes("/api/auth/csrf")) {
                return csrfFetchResponse
            }
            return {
                ok: false,
                json: async () => ({
                    success: false,
                    error: "Unmocked fetch",
                }),
            }
        })
    })

    describe("Form Submission (Requirement 3.1, 3.5, 3.6)", () => {
        it("should submit form with valid credentials", async () => {
            const user = userEvent.setup()

            ;(global.fetch as any).mockImplementation(async (url: string) => {
                if (String(url).includes("/api/auth/csrf")) {
                    return csrfFetchResponse
                }
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            userId: "123",
                            email: "john@example.com",
                            name: "John Doe",
                        },
                    }),
                }
            })

            await renderReadyLoginForm()

            // Fill in valid credentials
            await user.type(
                screen.getByRole("textbox", { name: /email/i }),
                "john@example.com"
            )
            await user.type(
                screen.getByPlaceholderText(/enter your password/i),
                "ValidPass123!"
            )

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
            await renderReadyLoginForm()

            // Fill in invalid email
            await user.type(
                screen.getByRole("textbox", { name: /email/i }),
                "invalid-email"
            )
            await user.type(
                screen.getByPlaceholderText(/enter your password/i),
                "ValidPass123!"
            )

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
    })

    describe("Error Handling (Requirement 3.2, 3.7)", () => {
        it("should display generic error for invalid credentials", async () => {
            const user = userEvent.setup()

            ;(global.fetch as any).mockImplementation(async (url: string) => {
                if (String(url).includes("/api/auth/csrf")) {
                    return csrfFetchResponse
                }
                return {
                    ok: false,
                    status: 401,
                    json: async () => ({
                        success: false,
                        error: "Invalid email or password",
                    }),
                }
            })

            await renderReadyLoginForm()

            // Fill in credentials
            await user.type(
                screen.getByRole("textbox", { name: /email/i }),
                "john@example.com"
            )
            await user.type(
                screen.getByPlaceholderText(/enter your password/i),
                "WrongPass123!"
            )

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

            ;(global.fetch as any).mockImplementation(async (url: string) => {
                if (String(url).includes("/api/auth/csrf")) {
                    return csrfFetchResponse
                }
                return {
                    ok: false,
                    status: 429,
                    json: async () => ({
                        success: false,
                        error: "Too many login attempts. Please try again later.",
                    }),
                }
            })

            await renderReadyLoginForm()

            // Fill in credentials
            await user.type(
                screen.getByRole("textbox", { name: /email/i }),
                "john@example.com"
            )
            await user.type(
                screen.getByPlaceholderText(/enter your password/i),
                "ValidPass123!"
            )

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

            ;(global.fetch as any).mockImplementation(async (url: string) => {
                if (String(url).includes("/api/auth/csrf")) {
                    return csrfFetchResponse
                }
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            userId: "123",
                            email: "john@example.com",
                            name: "John Doe",
                        },
                    }),
                }
            })

            await renderReadyLoginForm()

            // Fill in credentials
            await user.type(
                screen.getByRole("textbox", { name: /email/i }),
                "john@example.com"
            )
            await user.type(
                screen.getByPlaceholderText(/enter your password/i),
                "ValidPass123!"
            )

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

    describe("Loading State (Requirement 3.8)", () => {
        it("should disable form during submission", async () => {
            const user = userEvent.setup()

            ;(global.fetch as any).mockImplementation(async (url: string) => {
                if (String(url).includes("/api/auth/csrf")) {
                    return csrfFetchResponse
                }
                await new Promise(resolve => setTimeout(resolve, 100))
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            userId: "123",
                            email: "john@example.com",
                            name: "John Doe",
                        },
                    }),
                }
            })

            await renderReadyLoginForm()

            // Fill in credentials
            await user.type(
                screen.getByRole("textbox", { name: /email/i }),
                "john@example.com"
            )
            await user.type(
                screen.getByPlaceholderText(/enter your password/i),
                "ValidPass123!"
            )

            // Submit form
            await user.click(screen.getByRole("button", { name: /sign in/i }))

            // Button should show loading state
            await waitFor(() => {
                expect(
                    screen.getByRole("button", { name: /signing in/i })
                ).toBeDisabled()
            })

            // Inputs should be disabled
            expect(
                screen.getByRole("textbox", { name: /email/i })
            ).toBeDisabled()
            expect(
                screen.getByPlaceholderText(/enter your password/i)
            ).toBeDisabled()
        })
    })

    describe("CSRF Token (Requirement 6.1)", () => {
        it("should include CSRF token in form submission", async () => {
            const user = userEvent.setup()

            ;(global.fetch as any).mockImplementation(async (url: string) => {
                if (String(url).includes("/api/auth/csrf")) {
                    return csrfFetchResponse
                }
                return {
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            userId: "123",
                            email: "john@example.com",
                            name: "John Doe",
                        },
                    }),
                }
            })

            await renderReadyLoginForm()

            // Fill in credentials
            await user.type(
                screen.getByRole("textbox", { name: /email/i }),
                "john@example.com"
            )
            await user.type(
                screen.getByPlaceholderText(/enter your password/i),
                "ValidPass123!"
            )

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
})
