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
    }),
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
        // Set up environment variables
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id"
        process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI =
            "http://localhost:3000/api/auth/google/callback"

        // Mock window.location.href
        delete (window as any).location
        window.location = { href: "" } as any
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
        render(<GoogleLoginButton />)
        const button = screen.getByRole("button", {
            name: /login with google/i,
        })

        fireEvent.click(button)

        await waitFor(() => {
            expect(
                screen.getByRole("button", { name: /logging in/i })
            ).toBeInTheDocument()
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
