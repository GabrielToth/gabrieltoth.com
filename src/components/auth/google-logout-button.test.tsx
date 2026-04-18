/**
 * GoogleLogoutButton Component Tests
 * Unit tests for the GoogleLogoutButton component
 *
 * Validates: Requirements 21.1, 21.2, 21.3, 21.4
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GoogleLogoutButton } from "./google-logout-button"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
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

// Mock fetch
global.fetch = vi.fn()

describe("GoogleLogoutButton", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockPush.mockClear()
    })

    it("renders button with correct text", () => {
        render(<GoogleLogoutButton />)
        const button = screen.getByRole("button", { name: /logout/i })
        expect(button).toBeInTheDocument()
    })

    it("button is enabled by default", () => {
        render(<GoogleLogoutButton />)
        const button = screen.getByRole("button", { name: /logout/i })
        expect(button).not.toBeDisabled()
    })

    it("shows loading state when clicked", async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        })

        render(<GoogleLogoutButton />)
        const button = screen.getByRole("button", { name: /logout/i })

        fireEvent.click(button)

        await waitFor(() => {
            expect(
                screen.getByRole("button", { name: /logging out/i })
            ).toBeInTheDocument()
        })
    })

    it("sends POST request to /api/auth/logout", async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        })

        render(<GoogleLogoutButton />)
        const button = screen.getByRole("button", { name: /logout/i })

        fireEvent.click(button)

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/auth/logout",
                expect.objectContaining({
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
            )
        })
    })

    it("redirects to /auth/login on success", async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        })

        render(<GoogleLogoutButton />)
        const button = screen.getByRole("button", { name: /logout/i })

        fireEvent.click(button)

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/auth/login")
        })
    })

    it("calls onSuccess callback on success", async () => {
        const onSuccess = vi.fn()

        ;(global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        })

        render(<GoogleLogoutButton onSuccess={onSuccess} />)
        const button = screen.getByRole("button", { name: /logout/i })

        fireEvent.click(button)

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled()
        })
    })

    it("displays error message on failure", async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: "Logout failed" }),
        })

        render(<GoogleLogoutButton />)
        const button = screen.getByRole("button", { name: /logout/i })

        fireEvent.click(button)

        await waitFor(() => {
            expect(screen.getByText(/logout failed/i)).toBeInTheDocument()
        })
    })

    it("calls onError callback on failure", async () => {
        const onError = vi.fn()

        ;(global.fetch as any).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: "Logout failed" }),
        })

        render(<GoogleLogoutButton onError={onError} />)
        const button = screen.getByRole("button", { name: /logout/i })

        fireEvent.click(button)

        await waitFor(() => {
            expect(onError).toHaveBeenCalled()
        })
    })

    it("accepts custom className", () => {
        render(<GoogleLogoutButton className="custom-class" />)
        const button = screen.getByRole("button", { name: /logout/i })
        expect(button).toHaveClass("custom-class")
    })

    it("handles network errors", async () => {
        const onError = vi.fn()

        ;(global.fetch as any).mockRejectedValueOnce(new Error("Network error"))

        render(<GoogleLogoutButton onError={onError} />)
        const button = screen.getByRole("button", { name: /logout/i })

        fireEvent.click(button)

        await waitFor(() => {
            expect(onError).toHaveBeenCalled()
            expect(screen.getByText(/network error/i)).toBeInTheDocument()
        })
    })
})
