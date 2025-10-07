import { describe, expect, it } from "vitest"

describe("pc-optimization breadcrumbs coverage", () => {
    it("returns EN urls without locale prefix", async () => {
        const { getPCOptimizationBreadcrumbs } = await import(
            "@/app/[locale]/pc-optimization/pc-optimization-breadcrumbs"
        )
        const items = getPCOptimizationBreadcrumbs("en" as any)
        expect(items[0].url).toBe("https://www.gabrieltoth.com")
        expect(items[1].url).toBe("https://www.gabrieltoth.com/pc-optimization")
    })

    it("returns PT-BR urls with locale prefix", async () => {
        const { getPCOptimizationBreadcrumbs } = await import(
            "@/app/[locale]/pc-optimization/pc-optimization-breadcrumbs"
        )
        const items = getPCOptimizationBreadcrumbs("pt-BR" as any)
        expect(items[0].url).toBe("https://www.gabrieltoth.com/pt-BR")
        expect(items[1].url).toBe(
            "https://www.gabrieltoth.com/pt-BR/pc-optimization"
        )
    })

    it("returns ES names and urls with locale prefix", async () => {
        const { getPCOptimizationBreadcrumbs } = await import(
            "@/app/[locale]/pc-optimization/pc-optimization-breadcrumbs"
        )
        const items = getPCOptimizationBreadcrumbs("es" as any)
        expect(items[0].name).toBe("Servicios")
        expect(items[0].url).toBe("https://www.gabrieltoth.com/es")
        expect(items[1].name).toBe("Optimización de PC")
        expect(items[1].url).toBe(
            "https://www.gabrieltoth.com/es/pc-optimization"
        )
    })

    it("returns DE names and urls with locale prefix", async () => {
        const { getPCOptimizationBreadcrumbs } = await import(
            "@/app/[locale]/pc-optimization/pc-optimization-breadcrumbs"
        )
        const items = getPCOptimizationBreadcrumbs("de" as any)
        expect(items[0].name).toBe("Dienstleistungen")
        expect(items[0].url).toBe("https://www.gabrieltoth.com/de")
        expect(items[1].name).toBe("PC-Optimierung")
        expect(items[1].url).toBe(
            "https://www.gabrieltoth.com/de/pc-optimization"
        )
    })
})
