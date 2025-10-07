import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    const t: any = (k: string) => k
    t.raw = (key: string) => {
        if (key === "breadcrumbs") return [{ name: "Home", href: "/" }]
        if (key === "sections")
            return {
                acceptance: { title: "A", text: "a" },
                services: { title: "S", text: "s" },
                responsibilities: { title: "R", text: "r" },
                limitations: { title: "L", text: "l" },
                privacy: { title: "P", text: "p" },
                modifications: { title: "M", text: "m" },
                termination: { title: "T", text: "t" },
                governing: { title: "G", text: "g" },
                contact: { title: "C", text: "c" },
            }
        return []
    }
    return { getTranslations: vi.fn().mockResolvedValue(t) }
})

describe("terms-of-service page safe import", () => {
    it("imports and executes default export with mocked data", async () => {
        const mod = await import("../../app/[locale]/terms-of-service/page")
        const jsx = await mod.default({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(jsx).toBeTruthy()
    })
})
