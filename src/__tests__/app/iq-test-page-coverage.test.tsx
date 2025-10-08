import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    const t: any = (k: string) => k
    t.raw = (key: string) => {
        if (key === "landing.p1" || key === "landing.p2") return ["A", "B"]
        if (key === "sections.extra") return []
        if (key === "ctaEmotional.bullets") return ["X", "Y", "Z"]
        return []
    }
    return { getTranslations: vi.fn().mockResolvedValue(t) }
})

describe("[locale]/iq-test page executes and renders CTA emotional", () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it("renders default export with CTA emotional content", async () => {
        const { default: Page } = await import("@/app/[locale]/iq-test/page")
        const tree = await Page({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(tree).toBeTruthy()
    })
})
