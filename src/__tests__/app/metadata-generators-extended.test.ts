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

describe("metadata generators (extended)", () => {
    it("editors generateMetadata returns metadata", async () => {
        const mod = await import("@/app/[locale]/editors/editors-metadata")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata).toBeTruthy()
        expect(metadata.openGraph?.type).toBe("article")
        expect(metadata.alternates?.languages?.en).toContain("/en/editors/")
    })

    it("pc-optimization terms generateMetadata returns metadata", async () => {
        const mod =
            await import("@/app/[locale]/pc-optimization/terms/terms-metadata")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata).toBeTruthy()
        expect(metadata.openGraph?.type).toBe("website")
        expect(metadata.alternates?.languages?.en).toContain(
            "/en/pc-optimization/terms/"
        )
    })

    it("waveigl-support generateMetadata returns metadata", async () => {
        const mod =
            await import("@/app/[locale]/waveigl-support/waveigl-support-metadata")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata).toBeTruthy()
        expect(metadata.openGraph?.type).toBe("website")
        expect(metadata.alternates?.languages?.en).toContain(
            "/en/waveigl-support/"
        )
    })
})
