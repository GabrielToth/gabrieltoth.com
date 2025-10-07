import { describe, expect, it } from "vitest"

describe("breadcrumbs helpers coverage", () => {
    it("pc-optimization breadcrumbs returns translated list", async () => {
        const { getPCOptimizationBreadcrumbs } = await import(
            "@/app/[locale]/pc-optimization/pc-optimization-breadcrumbs"
        )
        const en = getPCOptimizationBreadcrumbs("en")
        const pt = getPCOptimizationBreadcrumbs("pt-BR")
        expect(en[0].name).toBe("Services")
        expect(pt[0].name).toBe("Serviços")
        expect(en[1].url).toContain("/pc-optimization")
    })

    it("waveigl breadcrumbs returns list", async () => {
        const { getWaveIGLSupportBreadcrumbs } = await import(
            "@/app/[locale]/waveigl-support/waveigl-support-breadcrumbs"
        )
        const list = await getWaveIGLSupportBreadcrumbs("en")
        expect(list.length).toBeGreaterThan(0)
        expect(list[list.length - 1].current).toBe(true)
    })
})
