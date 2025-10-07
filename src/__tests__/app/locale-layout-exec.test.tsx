import React from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => ({
    getMessages: async () => ({ dummy: true }),
}))

describe("[locale]/layout executes with messages and providers", () => {
    it("renders children using provided params", async () => {
        const params = Promise.resolve({ locale: "en" })
        const { default: LocaleLayout } = await import("@/app/[locale]/layout")
        const tree = await LocaleLayout({
            children: React.createElement("div", null, "child"),
            params,
        } as any)
        expect(tree).toBeTruthy()
    })

    it("exposes generateStaticParams", async () => {
        const mod = await import("@/app/[locale]/layout")
        const vals = mod.generateStaticParams()
        expect(Array.isArray(vals)).toBe(true)
        expect(vals.length).toBeGreaterThan(0)
    })
})
