import { describe, expect, it } from "vitest"

describe("i18n/request", () => {
    it("imports getRequestConfig and returns function", async () => {
        const mod = await import("@/i18n/request")
        expect(typeof mod.default).toBe("function")
    })
})
