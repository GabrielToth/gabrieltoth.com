/**
 * Tests for StreamTitleEditor Component
 * Covers rendering, input changes, save behavior, success/error messages
 */

import { StreamTitleEditor } from "@/components/dashboard/live/stream-title-editor"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("StreamTitleEditor", () => {
    const defaultProps = {
        platform: "twitch",
        currentTitle: "My Current Title",
        currentGame: "Just Chatting",
        onUpdate: vi.fn(),
    }

    beforeEach(() => {
        vi.useRealTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("renders title input and game input", () => {
        render(<StreamTitleEditor {...defaultProps} />)

        const titleInput = screen.getByPlaceholderText("Enter stream title...")
        expect(titleInput).toBeInTheDocument()
        expect(titleInput).toHaveValue("My Current Title")

        const gameInput = screen.getByPlaceholderText("Enter game or category...")
        expect(gameInput).toBeInTheDocument()
        expect(gameInput).toHaveValue("Just Chatting")
    })

    it("displays current values in inputs", () => {
        render(<StreamTitleEditor {...defaultProps} />)

        expect(screen.getByDisplayValue("My Current Title")).toBeInTheDocument()
        expect(screen.getByDisplayValue("Just Chatting")).toBeInTheDocument()
    })

    it("typing updates input value", () => {
        render(<StreamTitleEditor {...defaultProps} />)

        const titleInput = screen.getByPlaceholderText("Enter stream title...")
        fireEvent.change(titleInput, {
            target: { value: "New Stream Title" },
        })

        expect(titleInput).toHaveValue("New Stream Title")
    })

    it("save button calls POST /api/live/update with correct data", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        } as Response)

        render(<StreamTitleEditor {...defaultProps} />)
        const titleInput = screen.getByPlaceholderText("Enter stream title...")
        fireEvent.change(titleInput, {
            target: { value: "Updated Title" },
        })

        const saveButton = screen.getByText("Update Stream")
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith("/api/live/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: "twitch",
                    title: "Updated Title",
                    game_id: "Just Chatting",
                }),
            })
        })
    })

    it("shows success message when save succeeds", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        } as Response)

        render(<StreamTitleEditor {...defaultProps} />)
        const saveButton = screen.getByText("Update Stream")
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(screen.getByText("Stream updated!")).toBeInTheDocument()
        })
        expect(screen.getByText("Stream updated!")).toHaveClass("text-green-600")
    })

    it("shows error message on API error response", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({
                success: false,
                error: "Rate limited",
            }),
        } as Response)

        render(<StreamTitleEditor {...defaultProps} />)
        const saveButton = screen.getByText("Update Stream")
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(screen.getByText("Rate limited")).toBeInTheDocument()
        })
    })

    it("shows error message on network failure", async () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(
            new Error("Network error")
        )

        render(<StreamTitleEditor {...defaultProps} />)
        const saveButton = screen.getByText("Update Stream")
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(screen.getByText("Network error")).toBeInTheDocument()
        })
    })

    it("shows saving state while request is in progress", async () => {
        let resolvePromise: (value: unknown) => void
        const fetchPromise = new Promise(resolve => {
            resolvePromise = resolve
        })

        vi.spyOn(globalThis, "fetch").mockReturnValue(
            fetchPromise as Promise<Response>
        )

        render(<StreamTitleEditor {...defaultProps} />)
        const saveButton = screen.getByText("Update Stream")
        fireEvent.click(saveButton)

        expect(screen.getByText("Saving...")).toBeInTheDocument()
        expect(saveButton).toBeDisabled()

        resolvePromise!({
            ok: true,
            json: async () => ({ success: true }),
        } as Response)

        await waitFor(() => {
            expect(screen.getByText("Update Stream")).toBeInTheDocument()
        })
    })

    it("auto-dismisses message after 3 seconds", async () => {
        vi.useFakeTimers()
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        } as Response)

        render(<StreamTitleEditor {...defaultProps} />)
        const saveButton = screen.getByText("Update Stream")
        fireEvent.click(saveButton)

        // Wait for the fetch to resolve and state to update
        await vi.waitFor(() => {
            expect(screen.getByText("Stream updated!")).toBeInTheDocument()
        })

        // Advance past 3 seconds: flush the setTimeout callback
        act(() => {
            vi.advanceTimersByTime(3000)
        })

        // After React processes the state update, message should be gone
        expect(screen.queryByText("Stream updated!")).not.toBeInTheDocument()

        vi.useRealTimers()
    })
})
