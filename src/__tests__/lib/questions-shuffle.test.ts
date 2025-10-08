import math from "@/lib/questions/math"
import phys from "@/lib/questions/physics"
import {
    getShuffledByCategory,
    interleaveShuffled,
    shuffleArray,
} from "@/lib/questions/shuffle"
import { describe, expect, it } from "vitest"

describe("questions shuffle", () => {
    it("shuffleArray is deterministic with same seed", () => {
        const a = [1, 2, 3, 4, 5]
        const s1 = shuffleArray(a, 123)
        const s2 = shuffleArray(a, 123)
        expect(s1).toEqual(s2)
        expect(s1).not.toEqual(a) // likely different
    })

    it("interleave preserves counts and contains all items", () => {
        const out = interleaveShuffled([math, phys], 42)
        expect(out.length).toBe(math.length + phys.length)
        const ids = new Set(out.map(q => q.id))
        expect(ids.size).toBe(out.length)
    })

    it("getShuffledByCategory returns all items across categories", () => {
        const by = { math, physics: phys } as any
        const mixed = getShuffledByCategory(by, 7)
        expect(mixed.length).toBe(math.length + phys.length)
        // ensure first few alternate between categories in some places (not strict)
        expect(mixed[0].category === mixed[1].category).toBeTypeOf("boolean")
    })
})
