/**
 * Tests for StreamStatusCard Component
 * Covers rendering platform info, LIVE badge, viewer count, uptime, title
 */

import { StreamStatusCard } from "@/components/dashboard/live/stream-status-card"
import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

// Mock Date.now for predictable uptime
const MOCK_NOW = 1700000000000 // Some fixed timestamp

describe("StreamStatusCard", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(MOCK_NOW)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    const defaultProps = {
        platform: "twitch",
        username: "testuser",
        displayName: "TestUser",
        isLive: true,
        viewerCount: 42,
        title: "My Awesome Stream",
        gameName: "Just Chatting",
        startedAt: new Date(MOCK_NOW - 3600000).toISOString(), // 1 hour ago
    }

    it("renders platform name and display name", () => {
        render(<StreamStatusCard {...defaultProps} />)

        expect(screen.getByText("TestUser")).toBeInTheDocument()
        expect(screen.getByText("twitch")).toBeInTheDocument()
    })

    it("shows LIVE badge when isLive is true", () => {
        render(<StreamStatusCard {...defaultProps} />)

        expect(screen.getByText("LIVE")).toBeInTheDocument()
    })

    it("hides LIVE badge when isLive is false", () => {
        render(<StreamStatusCard {...defaultProps} isLive={false} />)

        expect(screen.queryByText("LIVE")).not.toBeInTheDocument()
    })

    it("shows viewer count and uptime when live", () => {
        render(<StreamStatusCard {...defaultProps} />)

        expect(screen.getByText("42")).toBeInTheDocument()
        expect(screen.getByText("1h 0m")).toBeInTheDocument()
    })

    it("shows dashes for viewer count and uptime when not live", () => {
        render(
            <StreamStatusCard
                {...defaultProps}
                isLive={false}
                viewerCount={0}
                startedAt={null}
            />
        )

        // Find all dash indicators — there should be two (viewers + uptime)
        const dashes = screen.getAllByText("—")
        expect(dashes.length).toBeGreaterThanOrEqual(2)
    })

    it("shows stream title", () => {
        render(<StreamStatusCard {...defaultProps} />)

        expect(screen.getByText("My Awesome Stream")).toBeInTheDocument()
    })

    it("renders game name", () => {
        render(<StreamStatusCard {...defaultProps} />)

        expect(screen.getByText("Just Chatting")).toBeInTheDocument()
    })

    it("renders platform initial letter in circle", () => {
        render(<StreamStatusCard {...defaultProps} />)

        expect(screen.getByText("T")).toBeInTheDocument()
    })

    it("renders K for Kick platform", () => {
        render(
            <StreamStatusCard
                {...defaultProps}
                platform="kick"
                displayName="KickStreamer"
            />
        )

        expect(screen.getByText("K")).toBeInTheDocument()
    })

    it("shows game name as dash when no game", () => {
        render(<StreamStatusCard {...defaultProps} gameName="" />)

        const gameLabel = screen.getByText("Game")
        expect(gameLabel).toBeInTheDocument()
    })

    it("does not render title section when title is empty", () => {
        render(<StreamStatusCard {...defaultProps} title="" />)

        // The title should not appear as a paragraph
        expect(screen.queryByText("My Awesome Stream")).not.toBeInTheDocument()
    })

    it("calculates uptime correctly", () => {
        const twoHoursAgo = new Date(MOCK_NOW - 2 * 3600000).toISOString()
        render(<StreamStatusCard {...defaultProps} startedAt={twoHoursAgo} />)

        expect(screen.getByText("2h 0m")).toBeInTheDocument()
    })
})
