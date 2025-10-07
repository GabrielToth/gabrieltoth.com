import { describe, expect, it } from "vitest"

describe("layout/footer module import", () => {
    it("imports footer (server component) without execution", async () => {
        const mod = await import("@/components/layout/footer")
        expect(mod).toBeTruthy()
    })
})
