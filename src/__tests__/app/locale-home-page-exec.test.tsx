import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getTranslations: async () => ({
        raw: () => ({}) as any,
    }),
}))

describe("[locale]/home page executes", () => {
    it("renders default export with mocked translations", async () => {
        const { default: Page } = await import("@/app/[locale]/page")
        const tree = await Page({
            params: Promise.resolve({ locale: "en" }),
        } as any)
        expect(tree).toBeTruthy()
    })
})
