import { locales } from "@/lib/i18n"
import type { QuestionPackName } from "@/lib/questions/loader"
import { loadQuestions } from "@/lib/questions/loader"
import mathQuestions from "@/lib/questions/math"
import physicsQuestions from "@/lib/questions/physics"
import { describe, expect, it } from "vitest"

describe("questions count and integrity", () => {
    it("math has exactly 100 items with correct shape", () => {
        expect(Array.isArray(mathQuestions)).toBe(true)
        expect(mathQuestions.length).toBe(100)

        const ids = new Set<string>()
        for (const q of mathQuestions) {
            expect(q.category).toBe("math")
            expect(typeof q.id).toBe("string")
            expect(q.id.length).toBeGreaterThan(0)
            expect(ids.has(q.id)).toBe(false)
            ids.add(q.id)

            expect(typeof q.prompt).toBe("string")
            expect(Array.isArray(q.choices)).toBe(true)
            expect(q.choices.length).toBe(4)
            expect(q.answerIndex).toBeGreaterThanOrEqual(0)
            expect(q.answerIndex).toBeLessThanOrEqual(3)
            // Non-language category should not require language field
            // Ensure no dependency on specific language text here
        }
    })

    it("physics has exactly 100 items with correct shape", () => {
        expect(Array.isArray(physicsQuestions)).toBe(true)
        expect(physicsQuestions.length).toBe(100)

        const ids = new Set<string>()
        for (const q of physicsQuestions) {
            expect(q.category).toBe("physics")
            expect(typeof q.id).toBe("string")
            expect(q.id.length).toBeGreaterThan(0)
            expect(ids.has(q.id)).toBe(false)
            ids.add(q.id)

            expect(typeof q.prompt).toBe("string")
            expect(Array.isArray(q.choices)).toBe(true)
            expect(q.choices.length).toBe(4)
            expect(q.answerIndex).toBeGreaterThanOrEqual(0)
            expect(q.answerIndex).toBeLessThanOrEqual(3)
        }
    })

    it("world_history has exactly 100 items for all locales", async () => {
        for (const locale of locales) {
            const pack = await loadQuestions(locale, "world_history")
            expect(pack.length).toBe(100)
            const ids = new Set<string>()
            for (const q of pack) {
                expect(q.category).toBe("world_history")
                expect(ids.has(q.id)).toBe(false)
                ids.add(q.id)
                expect(q.choices.length).toBe(4)
                expect(q.answerIndex).toBeGreaterThanOrEqual(0)
                expect(q.answerIndex).toBeLessThanOrEqual(3)
            }
        }
    })

    it("other categories have expected counts across locales", async () => {
        const expected: Record<QuestionPackName, number> = {
            math: 100,
            physics: 100,
            world_history: 100,
            biology: 100,
            science: 100,
            sociology: 100,
            philosophy: 100,
            logic: 1000,
            language: 100,
        }
        const categories = Object.keys(expected) as QuestionPackName[]
        for (const locale of locales) {
            for (const cat of categories) {
                const pack = await loadQuestions(locale, cat)
                expect(pack.length).toBe(expected[cat])
                const ids = new Set(pack.map(q => q.id))
                expect(ids.size).toBe(pack.length)
                for (const q of pack) {
                    expect(Array.isArray(q.choices)).toBe(true)
                    expect(q.choices.length).toBe(4)
                    expect(q.answerIndex).toBeGreaterThanOrEqual(0)
                    expect(q.answerIndex).toBeLessThanOrEqual(3)
                    if (cat === "language") {
                        // language-specific pack must be tagged with locale
                        expect(q.language).toBe(locale)
                    }
                }
            }
        }
    })
})
