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

describe("metadata generators", () => {
    it("privacy-policy generateMetadata returns metadata", async () => {
        const mod = await import(
            "@/app/[locale]/privacy-policy/privacy-policy-metadata"
        )
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata).toBeTruthy()
        expect(metadata.openGraph?.type).toBe("website")
    })

    it("terms-of-service generateMetadata returns metadata", async () => {
        const mod = await import(
            "@/app/[locale]/terms-of-service/terms-of-service-metadata"
        )
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata).toBeTruthy()
        expect(metadata.openGraph?.type).toBe("website")
    })

    it("home-metadata generateMetadata returns metadata", async () => {
        const mod = await import("@/app/[locale]/home-metadata")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata).toBeTruthy()
        expect(metadata.openGraph?.type).toBe("website")
    })

    it("pc-optimization generateMetadata returns metadata", async () => {
        const mod = await import(
            "@/app/[locale]/pc-optimization/pc-optimization-metadata"
        )
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata).toBeTruthy()
        expect(metadata.openGraph?.type).toBe("website")
    })
})
