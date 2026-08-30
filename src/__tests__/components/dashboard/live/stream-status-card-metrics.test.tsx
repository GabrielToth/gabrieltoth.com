import { StreamStatusCard } from "@/components/dashboard/live/stream-status-card"
import { render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("StreamStatusCard Per-Platform Metrics & Mode Indicator", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("displays LOCAL badge when localOnly is true or executionMode is local", () => {
        render(
            <StreamStatusCard
                platform="facebook"
                username="fbuser"
                displayName="FB User"
                isLive={true}
                viewerCount={150}
                title="Local FB Stream"
                gameName="Gaming"
                startedAt={new Date().toISOString()}
                executionMode="local"
                localOnly={true}
            />
        )

        expect(screen.getByText("LOCAL")).toBeInTheDocument()
        expect(
            screen.getByText(/facebook \(Apenas Local\)/i)
        ).toBeInTheDocument()
    })

    it("fetches and displays platform-specific bitrate and network stability metrics when live", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                platform: "twitch",
                metrics: {
                    bitrateKbps: 6000,
                    fps: 60,
                    droppedFrames: 0,
                    totalFrames: 3600,
                    latencyMs: 1800,
                    resolution: "1080p60",
                    codec: "h264",
                },
            }),
        } as Response)

        render(
            <StreamStatusCard
                platform="twitch"
                username="twitchuser"
                displayName="Twitch Streamer"
                isLive={true}
                viewerCount={1200}
                title="Twitch Live Stream"
                gameName="Valorant"
                startedAt={new Date().toISOString()}
                executionMode="cloud"
            />
        )

        await waitFor(() => {
            expect(screen.getByText("6000 kbps")).toBeInTheDocument()
            expect(
                screen.getByText(/H264 @ 1080p60 \(60 fps\)/i)
            ).toBeInTheDocument()
        })
    })
})
