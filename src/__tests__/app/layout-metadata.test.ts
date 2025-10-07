import { describe, expect, it } from "vitest"

describe("[locale]/layout-metadata generateMetadata", () => {
    it("returns metadata", async () => {
        const mod = await import("@/app/[locale]/layout-metadata")
        const metadata = await mod.generateMetadata({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(metadata).toBeTruthy()
        expect(metadata.openGraph?.type).toBe("website")
    })
})
