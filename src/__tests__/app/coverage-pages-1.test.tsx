import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    const fakeT: any = (k: string) => k
    fakeT.raw = (key: string) => {
        if (key.includes("faq")) {
            return [{ question: "Q", answer: "A" }]
        }
        if (key.includes("breadcrumbs")) {
            return [{ name: "Home", href: "/" }]
        }
        if (key.includes("pricing.plans")) {
            return [
                {
                    name: "Plan",
                    basePrice: 100,
                    description: "Desc",
                    features: ["F1"],
                    popular: true,
                },
            ]
        }
        if (key.includes("sections")) {
            return [{ title: "T", content: "C" }]
        }
        if (key.includes("jobPosting")) {
            return { foo: "bar" }
        }
        return []
    }
    return { getTranslations: vi.fn().mockResolvedValue(fakeT) }
})

describe("pages server components coverage (light execution)", () => {
    it("editors page executes default export", async () => {
        const mod = await import("../../app/[locale]/editors/page")
        const jsx = await mod.default({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(jsx).toBeTruthy()
    })

    it("privacy-policy page executes default export", async () => {
        const mod = await import("../../app/[locale]/privacy-policy/page")
        const jsx = await mod.default({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(jsx).toBeTruthy()
    })

    it("pc-optimization terms page executes default export", async () => {
        const mod =
            await import("../../app/[locale]/pc-optimization/terms/page")
        const jsx = await mod.default({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(jsx).toBeTruthy()
    })

    it("waveigl-support page executes default export", async () => {
        const mod = await import("../../app/[locale]/waveigl-support/page")
        const jsx = await mod.default({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(jsx).toBeTruthy()
    })
})
