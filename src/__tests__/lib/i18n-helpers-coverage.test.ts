import { describe, expect, it } from "vitest"

describe("lib/i18n-helpers coverage", () => {
    it("imports and exposes useNamespace hook", async () => {
        const mod = await import("@/lib/i18n-helpers")
        expect(typeof mod.useNamespace).toBe("function")
    })
})
