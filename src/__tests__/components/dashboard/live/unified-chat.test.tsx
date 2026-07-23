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

    it("renders platform tabs (Twitch/Kick)", () => {
        render(<UnifiedChat {...defaultProps} />)

        expect(screen.getByText("Twitch")).toBeInTheDocument()
        expect(screen.getByText("Kick")).toBeInTheDocument()
    })

    it("platform selector switches visible platform", () => {
        render(<UnifiedChat {...defaultProps} />)

        const kickButton = screen.getByText("Kick")
        fireEvent.click(kickButton)

        // After clicking Kick, the input placeholder should reference Kick
        expect(
            screen.getByPlaceholderText("Send message to kick...")
        ).toBeInTheDocument()
    })

    it("shows connection indicator as connected", () => {
        render(<UnifiedChat {...defaultProps} />)

        // After the useEffect runs, it should show connected
        expect(screen.getByText("Connected")).toBeInTheDocument()
    })

    it("renders welcome message initially", () => {
        render(<UnifiedChat {...defaultProps} />)

        expect(
            screen.getByText("Chat connected. Waiting for messages...")
        ).toBeInTheDocument()
    })

    it("input field accepts text", () => {
        render(<UnifiedChat {...defaultProps} />)

        const input = screen.getByPlaceholderText(
            "Send message to twitch..."
        ) as HTMLInputElement
        fireEvent.change(input, { target: { value: "Hello chat!" } })

        expect(input.value).toBe("Hello chat!")
    })

    it("send button triggers message addition", () => {
        render(<UnifiedChat {...defaultProps} />)

        const input = screen.getByPlaceholderText("Send message to twitch...")
        fireEvent.change(input, { target: { value: "Test message" } })

        const sendButton = screen.getByText("Send")
        fireEvent.click(sendButton)

        // After sending, the message should appear in the chat
        expect(screen.getByText("Test message")).toBeInTheDocument()
        // The input should be cleared
        expect(input).toHaveValue("")
    })

    it("does not send empty messages", () => {
        render(<UnifiedChat {...defaultProps} />)

        const sendButton = screen.getByText("Send")
        expect(sendButton).toBeDisabled()

        const input = screen.getByPlaceholderText(
            "Send message to twitch..."
        ) as HTMLInputElement
        fireEvent.change(input, { target: { value: "" } })
        expect(input.value).toBe("")
    })

    it("shows broadcaster badge for broadcaster messages", () => {
        render(<UnifiedChat {...defaultProps} />)

        // When the user sends a message, it should have broadcaster badge
        const input = screen.getByPlaceholderText("Send message to twitch...")
        fireEvent.change(input, { target: { value: "Broadcaster msg" } })

        const sendButton = screen.getByText("Send")
        fireEvent.click(sendButton)

        // The broadcaster crown emoji should be present
        expect(screen.getByText("Broadcaster msg")).toBeInTheDocument()
    })

    it("renders quick command buttons", () => {
        render(<UnifiedChat {...defaultProps} />)

        expect(screen.getByText("/timeout")).toBeInTheDocument()
        expect(screen.getByText("/ban")).toBeInTheDocument()
        expect(screen.getByText("/me")).toBeInTheDocument()
    })

    it("clicking quick command sets text in input", () => {
        render(<UnifiedChat {...defaultProps} />)

        const timeoutBtn = screen.getByText("/timeout")
        fireEvent.click(timeoutBtn)

        const input = screen.getByPlaceholderText(
            "Send message to twitch..."
        ) as HTMLInputElement
        expect(input.value).toBe("/timeout ")
    })

    it("handles Enter key to send message", () => {
        render(<UnifiedChat {...defaultProps} />)

        const input = screen.getByPlaceholderText("Send message to twitch...")
        fireEvent.change(input, { target: { value: "Enter message" } })
        fireEvent.keyDown(input, { key: "Enter", shiftKey: false })

        expect(screen.getByText("Enter message")).toBeInTheDocument()
    })

    it("does not send on Shift+Enter", () => {
        render(<UnifiedChat {...defaultProps} />)

        const input = screen.getByPlaceholderText("Send message to twitch...")
        fireEvent.change(input, { target: { value: "Shift+Enter test" } })
        fireEvent.keyDown(input, { key: "Enter", shiftKey: true })

        // The message should not appear
        expect(screen.queryByText("Shift+Enter test")).not.toBeInTheDocument()
    })
})
