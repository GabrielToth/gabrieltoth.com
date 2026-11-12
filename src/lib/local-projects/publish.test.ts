import { describe, it, expect, vi, afterEach } from "vitest"
import { planLocalPublish, publishLocally } from "./publish"

describe("LOCAL publish planner", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it("routes X text posts to the direct browser adapter", () => {
        const plan = planLocalPublish({
            platform: "x",
            contentType: "text_only",
            text: "hello world",
            characterCount: 11,
        })

        expect(plan).toMatchObject({
            ok: true,
            platform: "twitter",
            action: "twitter_text",
        })
    })

    it("routes YouTube video uploads to the resumable browser adapter", () => {
        const plan = planLocalPublish({
            platform: "youtube",
            hasVideo: true,
            durationSeconds: 45,
            fileSizeBytes: 50 * 1024 * 1024,
        })

        expect(plan).toMatchObject({
            ok: true,
            platform: "youtube",
            contentType: "short_video",
            action: "youtube_resumable_upload",
        })
    })

    it("blocks cloud-only platforms locally", () => {
        for (const platform of [
            "facebook",
            "instagram",
            "tiktok",
            "linkedin",
            "kwai",
        ]) {
            const plan = planLocalPublish({
                platform,
                hasImages: true,
                characterCount: 100,
                fileSizeBytes: 1024,
            })

            expect(plan.ok).toBe(false)
            if (!plan.ok) {
                expect(plan.code).toBe("INCOMPATIBLE_CONTENT")
                expect(plan.reasons.join(" ")).toContain("CLOUD")
            }
        }
    })

    it("fails closed when the local adapter is not implemented", () => {
        const plan = planLocalPublish({
            platform: "twitch",
            hasVideo: true,
            durationSeconds: 30,
        })

        expect(plan.ok).toBe(false)
        if (!plan.ok) {
            expect(plan.code).toBe("LOCAL_ADAPTER_REQUIRED")
            expect(plan.reasons.join(" ")).toContain("backend")
        }
    })

    it("rejects unknown platforms", () => {
        const plan = planLocalPublish({ platform: "myspace", text: "hi" })

        expect(plan.ok).toBe(false)
        if (!plan.ok) expect(plan.code).toBe("PLATFORM_NOT_SUPPORTED")
    })

    it("rejects text-only YouTube in local mode", () => {
        const plan = planLocalPublish({
            platform: "youtube",
            text: "a community post",
            characterCount: 17,
        })

        expect(plan.ok).toBe(false)
        if (!plan.ok) expect(plan.code).toBe("INCOMPATIBLE_CONTENT")
    })

    it("rejects X text beyond the 280 character limit", () => {
        const plan = planLocalPublish({
            platform: "twitter",
            contentType: "text_only",
            text: "x".repeat(281),
            characterCount: 281,
        })

        expect(plan.ok).toBe(false)
        if (!plan.ok) {
            expect(plan.code).toBe("INCOMPATIBLE_CONTENT")
            expect(plan.reasons.join(" ")).toContain("280")
        }
    })
})

describe("LOCAL publish executor — zero backend", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it("never calls our backend when no local channel is bound", async () => {
        const fetchSpy = vi.fn()
        vi.stubGlobal("fetch", fetchSpy)

        const result = await publishLocally({
            platform: "twitter",
            text: "hello",
            characterCount: 5,
        })

        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.code).toBe("LOCAL_CHANNEL_REQUIRED")
        expect(fetchSpy).not.toHaveBeenCalled()

        for (const call of fetchSpy.mock.calls) {
            expect(String(call[0])).not.toContain("/api/")
        }
    })

    it("refuses to publish an unsupported format without any network call", async () => {
        const fetchSpy = vi.fn()
        vi.stubGlobal("fetch", fetchSpy)

        const result = await publishLocally({
            platform: "facebook",
            text: "hello",
            characterCount: 5,
        })

        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.code).toBe("INCOMPATIBLE_CONTENT")
        expect(fetchSpy).not.toHaveBeenCalled()
    })
})
