import { describe, expect, it } from "vitest"

describe("channel-management metadata coverage", () => {
    it("generateMetadata returns metadata for en", async () => {
        const mod = await import(
            "../../app/[locale]/channel-management/channel-management-metadata"
        )
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
