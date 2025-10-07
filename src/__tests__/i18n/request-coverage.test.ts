import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    const getRequestConfig = (fn: any) => fn
    return { getRequestConfig } as any
})

describe("i18n request coverage", () => {
    it("returns messages for default and known locales", async () => {
        const mod = await import("@/i18n/request")
        const config = mod.default as any
        const en = await config({ locale: "en" })
        const pt = await config({ locale: "pt-BR" })
        expect(en.messages).toBeTruthy()
        expect(pt.messages).toBeTruthy()
    })
})
