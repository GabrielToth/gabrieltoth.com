import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/amazon-affiliate",
}))

vi.mock("@/hooks/use-locale", () => ({
    useLocale: () => ({ locale: "en" }),
}))

describe("amazon-affiliate page executes", () => {
    it("imports and renders default export", async () => {
        const mod = await import("@/app/[locale]/amazon-affiliate/page")
        expect(mod.default).toBeTruthy()
    })
})
