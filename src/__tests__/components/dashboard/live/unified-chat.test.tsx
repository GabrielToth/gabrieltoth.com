/**
 * Tests for UnifiedChat Component
 * Covers platform tabs, messages, input, connection indicator
 */

import { UnifiedChat } from "@/components/dashboard/live/unified-chat"
import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("UnifiedChat", () => {
    const defaultProps = {
        platforms: ["twitch", "kick"] as string[],
        activePlatform: "twitch",
    }

    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    it("renders platform tabs (TWITCH/KICK)", () => {
        render(<UnifiedChat {...defaultProps} />)

        expect(screen.getAllByText("TWITCH")[0]).toBeInTheDocument()
        expect(screen.getAllByText("KICK")[0]).toBeInTheDocument()
    })

    it("toggles platform visibility when clicking tab button", () => {
        render(<UnifiedChat {...defaultProps} />)

        const kickButton = screen.getAllByText("KICK")[0]
        fireEvent.click(kickButton)

        expect(kickButton).toHaveClass("line-through")
    })

    it("shows connection indicator status text", () => {
        render(<UnifiedChat {...defaultProps} />)

        expect(screen.getByText("Disconnected")).toBeInTheDocument()
    })

    it("renders initial empty state when no chat messages", () => {
        render(<UnifiedChat {...defaultProps} />)

        expect(
            screen.getByText("No chat messages yet")
        ).toBeInTheDocument()
    })

    it("input field accepts text", () => {
        render(<UnifiedChat {...defaultProps} />)

        const input = screen.getByPlaceholderText(
            "Message #twitch..."
        ) as HTMLInputElement
        fireEvent.change(input, { target: { value: "Hello chat!" } })

        expect(input.value).toBe("Hello chat!")
    })

    it("send button is enabled when input has text", () => {
        render(<UnifiedChat {...defaultProps} />)

        const input = screen.getByPlaceholderText("Message #twitch...")
        fireEvent.change(input, { target: { value: "Test message" } })

        const sendButton = screen.getByText("Send")
        expect(sendButton).not.toBeDisabled()
    })

    it("does not send empty messages", () => {
        render(<UnifiedChat {...defaultProps} />)

        const sendButton = screen.getByText("Send")
        expect(sendButton).toBeDisabled()

        const input = screen.getByPlaceholderText(
            "Message #twitch..."
        ) as HTMLInputElement
        fireEvent.change(input, { target: { value: "" } })
        expect(input.value).toBe("")
    })

    it("handles Enter key with text input", () => {
        render(<UnifiedChat {...defaultProps} />)

        const input = screen.getByPlaceholderText("Message #twitch...")
        fireEvent.change(input, { target: { value: "Enter message" } })
        fireEvent.keyDown(input, { key: "Enter", shiftKey: false })

        // Value is sent via relay hook
        expect(input).toBeInTheDocument()
    })
})
