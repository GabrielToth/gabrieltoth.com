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

describe("canonical + hreflang for tests pages", () => {
    it("iq-test landing has canonical and languages", async () => {
        const mod = await import("@/app/[locale]/iq-test/page")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata.alternates?.canonical).toContain("/en/iq-test/")
        expect(metadata.alternates?.languages?.["pt-BR"]).toContain(
            "/pt-BR/iq-test/"
        )
        expect(metadata.alternates?.languages?.["x-default"]).toContain(
            "/pt-BR/iq-test/"
        )
    })

    it("iq-test step has canonical and languages", async () => {
        const mod = await import("@/app/[locale]/iq-test/step/[step]/page")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en", step: "3" }),
        } as any)
        expect(metadata.alternates?.canonical).toContain("/en/iq-test/step/3/")
        expect(metadata.alternates?.languages?.["pt-BR"]).toContain(
            "/pt-BR/iq-test/step/3/"
        )
    })

    it("iq-test summary has canonical and languages", async () => {
        const mod = await import("@/app/[locale]/iq-test/summary/page")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata.alternates?.canonical).toContain("/en/iq-test/summary/")
        expect(metadata.alternates?.languages?.de).toContain(
            "/de/iq-test/summary/"
        )
    })

    it("personality landing has canonical and languages", async () => {
        const mod = await import("@/app/[locale]/personality-test/page")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata.alternates?.canonical).toContain(
            "/en/personality-test/"
        )
        expect(metadata.alternates?.languages?.["x-default"]).toContain(
            "/pt-BR/personality-test/"
        )
    })

    it("personality step has canonical and languages", async () => {
        const mod = await import(
            "@/app/[locale]/personality-test/step/[step]/page"
        )
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en", step: "7" }),
        } as any)
        expect(metadata.alternates?.canonical).toContain(
            "/en/personality-test/step/7/"
        )
        expect(metadata.alternates?.languages?.es).toContain(
            "/es/personality-test/step/7/"
        )
    })
})
