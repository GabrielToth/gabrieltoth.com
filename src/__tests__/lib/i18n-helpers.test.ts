import { describe, expect, it } from "vitest"

// The file exports only types or trivial helpers; ensure import executes
describe("i18n-helpers module import", () => {
    it("imports without errors", async () => {
        const mod = await import("@/lib/i18n-helpers")
        expect(mod).toBeTruthy()
    })
})
