import { describe, it, expect } from "vitest"
import {
    buildOgabrieltothSample,
    OGABRIELTOTH_SAMPLE_JSON,
} from "@/lib/discover/ogabrieltoth-sample"

describe("ogabrieltoth sample", () => {
    it("produces a single discovery user", () => {
        const sample = buildOgabrieltothSample()
        expect(Array.isArray(sample)).toBe(true)
        expect(sample).toHaveLength(1)
        expect(sample[0].userId).toBe("ogabrieltoth")
    })

    it("includes the expected platforms", () => {
        const [user] = buildOgabrieltothSample()
        const keys = Object.keys(user.platforms).sort()
        expect(keys).toEqual(
            ["instagram", "kick", "tiktok", "twitch", "youtube"].sort()
        )
    })

    it("every platform entry has required fields", () => {
        const [user] = buildOgabrieltothSample()
        for (const p of Object.values(user.platforms)) {
            expect(p.username).toBe("ogabrieltoth")
            expect(typeof p.isLive).toBe("boolean")
        }
    })

    it("serializes to valid JSON containing ogabrieltoth", () => {
        const parsed = JSON.parse(OGABRIELTOTH_SAMPLE_JSON)
        expect(parsed[0].userId).toBe("ogabrieltoth")
    })
})
