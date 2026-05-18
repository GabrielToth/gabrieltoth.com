import { beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn(async () => {
        const t = (key: string) => key
        t.rich = (key: string) => key
        return t
    }),
}))

describe("channel-management metadata coverage", () => {
    beforeAll(() => {
        vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com")
    })

    it("generateMetadata returns metadata for en", async () => {
        const mod =
            await import("../../app/[locale]/channel-management/channel-management-metadata")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata).toBeTruthy()
        expect(metadata.openGraph).toBeTruthy()
        expect(metadata.alternates?.languages?.en).toContain(
            "/en/channel-management/"
        )
    })
})
