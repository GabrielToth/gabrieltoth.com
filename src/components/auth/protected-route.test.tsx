/**
 * ProtectedRoute Component Tests
 * Unit tests for the ProtectedRoute component
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ProtectedRoute } from "./protected-route"

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

import { useAuth } from "@/hooks/use-auth"

describe("ProtectedRoute Component", () => {
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
        })

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        )

        expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it("redirects to login when not authenticated", async () => {
        ;(useAuth as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        })

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        )

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/auth/login")
        })
    })

    it("renders children when authenticated", () => {
        ;(useAuth as any).mockReturnValue({
            user: { id: "user-123" },
            isAuthenticated: true,
            isLoading: false,
            error: null,
        })

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        )

        expect(screen.getByText(/protected content/i)).toBeInTheDocument()
    })

    it("does not redirect when authenticated", () => {
        ;(useAuth as any).mockReturnValue({
            user: { id: "user-123" },
            isAuthenticated: true,
            isLoading: false,
            error: null,
        })

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        )

        expect(mockPush).not.toHaveBeenCalled()
    })

    it("returns null when not authenticated and not loading", () => {
        ;(useAuth as any).mockReturnValue({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        })

        const { container } = render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        )

        // After redirect, component should render nothing
        expect(container.firstChild).toBeNull()
    })

    it("renders multiple children", () => {
        ;(useAuth as any).mockReturnValue({
            user: { id: "user-123" },
            isAuthenticated: true,
            isLoading: false,
            error: null,
        })

        render(
            <ProtectedRoute>
                <div>Content 1</div>
                <div>Content 2</div>
            </ProtectedRoute>
        )

        expect(screen.getByText(/content 1/i)).toBeInTheDocument()
        expect(screen.getByText(/content 2/i)).toBeInTheDocument()
    })
})
