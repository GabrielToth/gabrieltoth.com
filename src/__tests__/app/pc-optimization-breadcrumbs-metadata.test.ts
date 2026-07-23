import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn(async ({ locale }: { locale: string }) => {
        const translations: Record<string, Record<string, unknown>> = {
            en: {
                breadcrumbs: {
                    services: "Services",
                    pcOptimization: "PC Optimization",
                },
            },
            "pt-BR": {
                breadcrumbs: {
                    services: "Serviços",
                    pcOptimization: "Otimização de PC",
                },
            },
        }
        const data = translations[locale] ?? {}
        const t = (key: string) => {
            const parts = key.split(".")
            let obj: unknown = data
            for (const part of parts) {
                obj = (obj as Record<string, unknown>)?.[part]
            }
            return (obj as string) ?? key
        }
        return t
    }),
}))

describe("pc-optimization helpers coverage", () => {
    it("getPCOptimizationBreadcrumbs returns localized crumbs", async () => {
        const { getPCOptimizationBreadcrumbs } =
            await import("@/app/[locale]/pc-optimization/pc-optimization-breadcrumbs")
        const en = await getPCOptimizationBreadcrumbs("en" as any)
        const pt = await getPCOptimizationBreadcrumbs("pt-BR" as any)
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
