/**
 * Dashboard Component Tests
 * Unit tests for the Dashboard component
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Dashboard } from "./dashboard"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

// Mock useAuth hook
vi.mock("@/hooks/use-auth", () => ({
    useAuth: vi.fn(),
}))

// Mock GoogleLogoutButton
vi.mock("@/components/auth/google-logout-button", () => ({
    GoogleLogoutButton: () => <button>Logout</button>,
}))

import { useAuth } from "@/hooks/use-auth"

describe("Dashboard Component", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockPush.mockClear()
    })

    it("displays loading state initially", () => {
        ;(useAuth as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            error: null,
            logout: vi.fn(),
        })

        render(<Dashboard />)
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it("redirects to login when not authenticated", async () => {
        ;(useAuth as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            logout: vi.fn(),
        })

        render(<Dashboard />)

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/auth/login")
        })
    })

    it("displays user information when authenticated", () => {
        const userData = {
            id: "user-123",
            google_email: "user@example.com",
            google_name: "Test User",
            google_picture: "https://example.com/pic.jpg",
        }

        ;(useAuth as any).mockReturnValue({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            logout: vi.fn(),
        })

        render(<Dashboard />)

        expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument()
        expect(screen.getByText(/user@example.com/i)).toBeInTheDocument()
    })

    it("displays user profile picture when available", () => {
        const userData = {
            id: "user-123",
            google_email: "user@example.com",
            google_name: "Test User",
            google_picture: "https://example.com/pic.jpg",
        }

        ;(useAuth as any).mockReturnValue({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            logout: vi.fn(),
        })

        render(<Dashboard />)

        const img = screen.getByAltText("Test User")
        expect(img).toBeInTheDocument()
        expect(img).toHaveAttribute("src", "https://example.com/pic.jpg")
    })

    it("displays logout button", () => {
        const userData = {
            id: "user-123",
            google_email: "user@example.com",
            google_name: "Test User",
        }

        ;(useAuth as any).mockReturnValue({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            logout: vi.fn(),
        })

        render(<Dashboard />)

        expect(
            screen.getByRole("button", { name: /logout/i })
        ).toBeInTheDocument()
    })

    it("displays dashboard title", () => {
        const userData = {
            id: "user-123",
            google_email: "user@example.com",
            google_name: "Test User",
        }

        ;(useAuth as any).mockReturnValue({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            logout: vi.fn(),
        })

        render(<Dashboard />)

        expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })

    it("returns null when not authenticated and not loading", () => {
        ;(useAuth as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            logout: vi.fn(),
        })

        const { container } = render(<Dashboard />)

        // After redirect, component should render nothing
        expect(container.firstChild).toBeNull()
    })
})
