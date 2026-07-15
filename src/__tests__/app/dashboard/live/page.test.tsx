/**
 * Integration tests for Live Dashboard Page
 * Covers data fetching, loading/error/success states
 */

import LiveDashboardPage from "@/app/[locale]/dashboard/live/page"
import { render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mockLiveData = {
    success: true,
    data: [
        {
            platform: "twitch",
            username: "ogabrieltoth",
            displayName: "GabrielToth",
            profileImageUrl: null,
            isLive: true,
            viewerCount: 42,
            title: "Streaming live!",
            gameName: "Just Chatting",
            startedAt: new Date(Date.now() - 3600000).toISOString(),
        },
    ],
}

describe("LiveDashboardPage", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("shows loading state initially", () => {
        // Don't resolve the fetch yet — keep loading indefinitely
        vi.spyOn(globalThis, "fetch").mockReturnValue(
            new Promise(() => {}) as Promise<Response>
        )

        render(<LiveDashboardPage />)

        // Should show a loading spinner with translation text
        expect(screen.getByText("Loading stream status...")).toBeInTheDocument()
    })

    it("fetches live status from /api/live/status on mount", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => mockLiveData,
        } as Response)

        render(<LiveDashboardPage />)

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith("/api/live/status")
        })
    })

    it("shows error state with retry button on fetch failure", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
        } as Response)

        render(<LiveDashboardPage />)

        await waitFor(() => {
            expect(
                screen.getByText(/Failed to load stream data/)
            ).toBeInTheDocument()
        })

        // Should have a retry button
        const retryButton = screen.getByRole("button", { name: /Retry/i })
        expect(retryButton).toBeInTheDocument()
    })

    it("shows error message on network failure", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(
            new Error("Network error")
        )

        render(<LiveDashboardPage />)

        await waitFor(() => {
            // Error text is "Failed to load stream data: Network error"
            expect(screen.getByText(/Network error/)).toBeInTheDocument()
        })
    })

    it("shows StreamStatusCard for each platform", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => mockLiveData,
        } as Response)

        render(<LiveDashboardPage />)

        await waitFor(() => {
            expect(screen.getByText("GabrielToth")).toBeInTheDocument()
            expect(screen.getByText("LIVE")).toBeInTheDocument()
            expect(screen.getByText("Streaming live!")).toBeInTheDocument()
        })
    })

    it("shows StreamTitleEditor for active platform", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => mockLiveData,
        } as Response)

        render(<LiveDashboardPage />)

        await waitFor(() => {
            expect(
                screen.getByPlaceholderText("Enter stream title...")
            ).toBeInTheDocument()
            expect(
                screen.getByDisplayValue("Streaming live!")
            ).toBeInTheDocument()
        })
    })

    it("shows UnifiedChat component", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => mockLiveData,
        } as Response)

        render(<LiveDashboardPage />)

        await waitFor(() => {
            // UnifiedChat welcome message
            expect(
                screen.getByText("Chat connected. Waiting for messages...")
            ).toBeInTheDocument()
            // Input placeholder confirms UnifiedChat rendered
            expect(
                screen.getByPlaceholderText("Send message to twitch...")
            ).toBeInTheDocument()
        })
    })

    it("shows empty state when no platforms are connected", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: [] }),
        } as Response)

        render(<LiveDashboardPage />)

        await waitFor(() => {
            expect(
                screen.getByText(/No live platforms connected/)
            ).toBeInTheDocument()
        })
    })
})
