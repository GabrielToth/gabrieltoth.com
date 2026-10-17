import { describe, expect, it, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useLiveMetricsRecorder } from "./use-live-metrics-recorder"

describe("useLiveMetricsRecorder", () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal("fetch", fetchMock.mockResolvedValue(undefined))
    })

    it("does not post when no platform is live", () => {
        renderHook(() =>
            useLiveMetricsRecorder([
                { platform: "twitch", isLive: false, viewerCount: 100 },
            ])
        )

        expect(fetchMock).not.toHaveBeenCalled()
    })

    it("posts metrics for each live platform", () => {
        renderHook(() =>
            useLiveMetricsRecorder([
                { platform: "twitch", isLive: true, viewerCount: 120 },
                { platform: "kick", isLive: true, viewerCount: 45 },
                { platform: "youtube", isLive: false, viewerCount: 0 },
            ])
        )

        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/live/metrics",
            expect.objectContaining({
                method: "POST",
                body: expect.stringContaining('"platform":"twitch"'),
            })
        )
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/live/metrics",
            expect.objectContaining({
                body: expect.stringContaining('"viewers":45'),
            })
        )
    })

    it("throttles repeated posts within the interval window", () => {
        const { rerender } = renderHook(
            ({ platforms }) => useLiveMetricsRecorder(platforms),
            {
                initialProps: {
                    platforms: [
                        { platform: "twitch", isLive: true, viewerCount: 100 },
                    ],
                },
            }
        )

        expect(fetchMock).toHaveBeenCalledTimes(1)

        // Re-render with updated viewers within the throttle window
        rerender({
            platforms: [{ platform: "twitch", isLive: true, viewerCount: 150 }],
        })

        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it("does not crash when fetch rejects", () => {
        fetchMock.mockRejectedValue(new Error("network down"))

        expect(() =>
            renderHook(() =>
                useLiveMetricsRecorder([
                    { platform: "twitch", isLive: true, viewerCount: 10 },
                ])
            )
        ).not.toThrow()
    })
})
