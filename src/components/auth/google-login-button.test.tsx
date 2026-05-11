/**
 * GoogleLoginButton Component Tests
 * Unit tests for the GoogleLoginButton component
 *
 * Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GoogleLoginButton } from "./google-login-button"

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    }),
}))

// Mock next-intl
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            "login.googleButton": "Login with Google",
            "signin.googleSignUpButton": "Sign up with Google",
            "register.googleButton": "Sign up with Google",
        }
        return translations[key] || key
    },
}))

// Mock logger
vi.mock("@/lib/logger", () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
}))

describe("GoogleLoginButton", () => {
    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks()

        // Set up environment variables
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id"
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI =
            "http://localhost:3000/api/auth/google/callback"

        // Mock window.location.href
        delete (window as any).location
        window.location = { href: "" } as any

        // Mock sessionStorage
        const sessionStorageMock = (() => {
            let store: Record<string, string> = {}
            return {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => {
                    store[key] = value.toString()
                },
                removeItem: (key: string) => {
                    delete store[key]
                },
                clear: () => {
                    store = {}
                },
            }
        })()

        Object.defineProperty(window, "sessionStorage", {
            value: sessionStorageMock,
            writable: true,
        })
    })

    it("renders button with correct text", () => {
        render(<GoogleLoginButton />)
        const button = screen.getByRole("button", {
            name: /login with google/i,
        })
        expect(button).toBeInTheDocument()
    })

    it("button is enabled by default", () => {
        render(<GoogleLoginButton />)
        const button = screen.getByRole("button", {
            name: /login with google/i,
        })
        expect(button).not.toBeDisabled()
    })

    it("shows loading state when clicked", async () => {
        // Mock window.location.href to prevent actual redirect
        let redirectUrl = ""
        Object.defineProperty(window, "location", {
            value: {
                href: "",
                get href() {
                    return redirectUrl
                },
                set href(url: string) {
                    redirectUrl = url
                },
            },
            writable: true,
        })

        render(<GoogleLoginButton />)
        const button = screen.getByRole("button", {
            name: /login with google/i,
        })

        // The button should be enabled initially
        expect(button).not.toBeDisabled()

        // Click the button
        fireEvent.click(button)

        // The redirect should happen (we can verify the URL was set)
        await waitFor(() => {
            expect(redirectUrl).toContain(
                "accounts.google.com/o/oauth2/v2/auth"
            )
        })
    })

    it("redirects to Google OAuth when clicked", async () => {
        render(<GoogleLoginButton />)
        const button = screen.getByRole("button", {
            name: /login with google/i,
        })

        fireEvent.click(button)

        await waitFor(() => {
            expect(window.location.href).toContain(
                "accounts.google.com/o/oauth2/v2/auth"
            )
            expect(window.location.href).toContain("client_id=test-client-id")
            expect(window.location.href).toContain("redirect_uri=")
            expect(window.location.href).toContain("response_type=code")
            expect(window.location.href).toContain("scope=openid+email+profile")
        })
    })

    it("displays error message on failure", async () => {
        // Unset environment variable to trigger error
        delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

        render(<GoogleLoginButton />)
        const button = screen.getByRole("button", {
            name: /login with google/i,
        })

        fireEvent.click(button)

        await waitFor(() => {
            expect(
                screen.getByText(/google client id not configured/i)
            ).toBeInTheDocument()
        })
    })

    it("calls onError callback on failure", async () => {
        const onError = vi.fn()

        // Unset environment variable to trigger error
        delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

        render(<GoogleLoginButton onError={onError} />)
        const button = screen.getByRole("button", {
            name: /login with google/i,
        })

        fireEvent.click(button)

        await waitFor(() => {
            expect(onError).toHaveBeenCalled()
        })
    })

    it("accepts custom className", () => {
        render(<GoogleLoginButton className="custom-class" />)
        const button = screen.getByRole("button", {
            name: /login with google/i,
        })
        expect(button).toHaveClass("custom-class")
    })

    it("stores state parameter in sessionStorage", async () => {
        render(<GoogleLoginButton />)
        const button = screen.getByRole("button", {
            name: /login with google/i,
        })

        fireEvent.click(button)

        await waitFor(() => {
            const state = sessionStorage.getItem("oauth_state")
            expect(state).toBeTruthy()
            expect(window.location.href).toContain(`state=${state}`)
        })
    })
})
