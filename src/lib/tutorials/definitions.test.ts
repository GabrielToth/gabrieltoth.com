import { describe, it, expect } from "vitest"
import {
    CATEGORY_TUTORIALS,
    ONBOARDING_TUTORIAL,
    getTutorialById,
    getTutorialsForCategory,
} from "@/lib/tutorials/definitions"
import { DASHBOARD_CATEGORIES } from "@/lib/tutorials/types"

describe("tutorial definitions", () => {
    it("exposes onboarding tutorial flagged as onboarding", () => {
        expect(ONBOARDING_TUTORIAL.isOnboarding).toBe(true)
        expect(ONBOARDING_TUTORIAL.category).toBe("onboarding")
    })

    it("has an entry for every dashboard category plus onboarding", () => {
        const categories = CATEGORY_TUTORIALS.map(t => t.category)
        for (const c of DASHBOARD_CATEGORIES) {
            expect(categories).toContain(c)
        }
        expect(categories).toContain("onboarding")
    })

    it("every step has a target selector and sequential index", () => {
        for (const tutorial of CATEGORY_TUTORIALS) {
            expect(tutorial.steps.length).toBeGreaterThan(0)
            tutorial.steps.forEach((step, i) => {
                expect(step.index).toBe(i)
                expect(typeof step.target).toBe("string")
                expect(step.target.length).toBeGreaterThan(0)
                expect(step.title).toBeTruthy()
                expect(step.description).toBeTruthy()
            })
        }
    })

    it("getTutorialById returns the matching tutorial or null", () => {
        expect(getTutorialById("publish")?.id).toBe("publish")
        expect(getTutorialById(null)).toBeNull()
        expect(getTutorialById("nope")).toBeNull()
    })

    it("getTutorialsForCategory filters by category", () => {
        const live = getTutorialsForCategory("live")
        expect(live.length).toBe(1)
        expect(live[0].category).toBe("live")
    })

    it("onboarding steps reference stable data-tutorial selectors", () => {
        for (const step of ONBOARDING_TUTORIAL.steps) {
            expect(step.target.startsWith("[data-tutorial=")).toBe(true)
        }
    })
})
