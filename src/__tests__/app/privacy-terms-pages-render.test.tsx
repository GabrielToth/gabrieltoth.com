import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    return {
        getTranslations: vi.fn().mockResolvedValue(
            Object.assign((k: string) => k, {
                raw: (_k: string) => [{ title: "T", content: "C" }],
            }) as any
        ),
    }
})

describe("privacy and terms pages render functions", () => {
    it("imports privacy-policy page (server component)", async () => {
        const mod = await import("@/app/[locale]/privacy-policy/page")
        expect(typeof mod.default).toBe("function")
    })
    it("imports terms-of-service page (server component)", async () => {
        const mod = await import("@/app/[locale]/terms-of-service/page")
        expect(typeof mod.default).toBe("function")
    })
})
