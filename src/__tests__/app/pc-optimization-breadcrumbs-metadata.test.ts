import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: async () => ({
        // minimal shape used in generateMetadata
        ...(new Proxy({}, { get: () => () => "subtitle" }) as any),
    }),
}))

describe("pc-optimization helpers coverage", () => {
    it("getPCOptimizationBreadcrumbs returns localized crumbs", async () => {
        const { getPCOptimizationBreadcrumbs } =
            await import("@/app/[locale]/pc-optimization/pc-optimization-breadcrumbs")
        const en = getPCOptimizationBreadcrumbs("en" as any)
        const pt = getPCOptimizationBreadcrumbs("pt-BR" as any)
        expect(en[0].name).toBe("Services")
        expect(pt[0].name).toBe("Serviços")
    })

    it("pc-optimization generateMetadata produces title and og/twitter", async () => {
        const { generateMetadata } =
            await import("@/app/[locale]/pc-optimization/pc-optimization-metadata")
        const md = await generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(md.title).toBeTruthy()
        expect(md.openGraph).toBeTruthy()
        expect(md.twitter).toBeTruthy()
    })
})
