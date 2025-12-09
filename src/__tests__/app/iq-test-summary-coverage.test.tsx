import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    const t: any = (k: string, v?: any) => k
    t.raw = () => []
    return { getTranslations: vi.fn().mockResolvedValue(t) }
})

vi.mock("@/lib/currency", () => ({
    getCurrencyForLocale: (locale: string) =>
        locale === "pt-BR" ? "BRL" : "USD",
}))

describe("[locale]/iq-test/summary page coverage", () => {
    it("renders with USD pricing", async () => {
        const { default: SummaryPage } =
            await import("@/app/[locale]/iq-test/summary/page")
        const jsx = await SummaryPage({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(jsx).toBeTruthy()
    })

    it("renders with BRL conversion", async () => {
        const { default: SummaryPage } =
            await import("@/app/[locale]/iq-test/summary/page")
        const jsx = await SummaryPage({
            params: Promise.resolve({ locale: "pt-BR" }),
        } as any)
        expect(jsx).toBeTruthy()
    })
})
