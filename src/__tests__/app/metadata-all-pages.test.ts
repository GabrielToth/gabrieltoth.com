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

// Utility to assert canonical + hreflang for any generateMetadata
async function assertMetadata(modPath: string, path: string) {
    const mod: any = await import(modPath)
    const locales = ["en", "pt-BR", "es", "de"] as const
    for (const locale of locales) {
        const meta = await mod.generateMetadata({
            params: Promise.resolve({ locale }),
        } as any)
        expect(meta).toBeTruthy()
        expect(meta.alternates?.canonical).toContain(
            `/${locale === "en" ? "en" : locale}${path}`
        )
        // Verify languages map has all locales and x-default pointing to pt-BR
        expect(meta.alternates?.languages?.["en"]).toContain("/en")
        expect(meta.alternates?.languages?.["pt-BR"]).toContain("/pt-BR")
        expect(meta.alternates?.languages?.["es"]).toContain("/es")
        expect(meta.alternates?.languages?.["de"]).toContain("/de")
        expect(meta.alternates?.languages?.["x-default"]).toContain("/pt-BR")
    }
}

describe("metadata for all core pages", () => {
    it("home", async () => {
        await assertMetadata("@/app/[locale]/home-metadata", "/")
    })

    it("editors", async () => {
        await assertMetadata(
            "@/app/[locale]/editors/editors-metadata",
            "/editors/"
        )
    })

    it("channel-management", async () => {
        await assertMetadata(
            "@/app/[locale]/channel-management/channel-management-metadata",
            "/channel-management/"
        )
    })

    it("pc-optimization", async () => {
        await assertMetadata(
            "@/app/[locale]/pc-optimization/pc-optimization-metadata",
            "/pc-optimization/"
        )
    })

    it("pc-optimization terms", async () => {
        await assertMetadata(
            "@/app/[locale]/pc-optimization/terms/terms-metadata",
            "/pc-optimization/terms/"
        )
    })

    it("privacy-policy", async () => {
        await assertMetadata(
            "@/app/[locale]/privacy-policy/privacy-policy-metadata",
            "/privacy-policy/"
        )
    })

    it("terms-of-service", async () => {
        await assertMetadata(
            "@/app/[locale]/terms-of-service/terms-of-service-metadata",
            "/terms-of-service/"
        )
    })

    it("waveigl-support", async () => {
        await assertMetadata(
            "@/app/[locale]/waveigl-support/waveigl-support-metadata",
            "/waveigl-support/"
        )
    })

    it("iq-test landing", async () => {
        const mod: any = await import("@/app/[locale]/iq-test/page")
        const locales = ["en", "pt-BR", "es", "de"] as const
        for (const locale of locales) {
            const meta = await mod.generateMetadata({
                params: Promise.resolve({ locale }),
            } as any)
            expect(meta.alternates?.canonical).toContain(
                `/${locale === "en" ? "en" : locale}/iq-test/`
            )
        }
    })
})
