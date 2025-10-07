import { defaultLocale } from "@/lib/i18n"
import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    const getRequestConfig = (fn: any) => fn
    return { getRequestConfig } as any
})

describe("i18n/request all locales coverage", () => {
    it("loads messages for all supported locales and falls back for unknown", async () => {
        const mod = await import("@/i18n/request")
        const config = mod.default as any
        const locales = ["de", "en", "es", "pt-BR"]
        for (const locale of locales) {
            const result = await config({ locale })
            expect(result.locale).toBe(locale)
            expect(result.messages).toBeTruthy()
        }
        // Unknown locale falls back to default
        const unknown = await config({ locale: "xx" })
        expect(unknown.locale).toBe(defaultLocale)
        expect(unknown.messages).toBeTruthy()
    })
})
