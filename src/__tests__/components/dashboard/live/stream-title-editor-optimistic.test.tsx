import { StreamTitleEditor } from "@/components/dashboard/live/stream-title-editor"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("StreamTitleEditor Optimistic UI & Spinner", () => {
    const defaultProps = {
        platform: "kick",
        currentTitle: "Original Kick Title",
        currentGame: "Just Chatting",
        onUpdate: vi.fn(),
        onUpdateOptimistic: vi.fn(),
        executionMode: "cloud" as const,
    }

    beforeEach(() => {
        vi.useRealTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("triggers onUpdateOptimistic immediately when save button is clicked", async () => {
        let resolveFetch: (value: any) => void = () => {}
        const fetchPromise = new Promise(resolve => {
            resolveFetch = resolve
        })

        vi.spyOn(globalThis, "fetch").mockReturnValue(
            fetchPromise.then(() => ({
                ok: true,
                json: async () => ({ success: true }),
            })) as any
        )

        render(<StreamTitleEditor {...defaultProps} />)

        const titleInput = screen.getByPlaceholderText("Enter stream title...")
        fireEvent.change(titleInput, {
            target: { value: "New Optimistic Title" },
        })

        const saveButton = screen.getByText("Update Stream")
        fireEvent.click(saveButton)

        // Verify optimistic update callback was called immediately before fetch resolves
        expect(defaultProps.onUpdateOptimistic).toHaveBeenCalledWith(
            "kick",
            "New Optimistic Title",
            "Just Chatting"
        )

        // Verify spinner/saving state is active
        expect(screen.getByText("Saving...")).toBeInTheDocument()

        // Resolve fetch and complete promise
        resolveFetch(null)
        await waitFor(() => {
            expect(defaultProps.onUpdate).toHaveBeenCalled()
        })
    })

    it("renders loading spinner while request is in progress", async () => {
        let resolveFetch: (value: any) => void = () => {}
        const fetchPromise = new Promise(resolve => {
            resolveFetch = resolve
        })

        vi.spyOn(globalThis, "fetch").mockReturnValue(
            fetchPromise.then(() => ({
                ok: true,
                json: async () => ({
                    success: true,
                    message: "Stream updated!",
                }),
            })) as any
        )

        render(<StreamTitleEditor {...defaultProps} />)

        const saveButton = screen.getByText("Update Stream")
        fireEvent.click(saveButton)

        // Verify saving status indicator text and spinner are present
        expect(screen.getByText("Saving...")).toBeInTheDocument()

        resolveFetch(null)
        await waitFor(() => {
            expect(screen.getByText("Stream updated!")).toBeInTheDocument()
        })
    })
})
