import React from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    return {
        getTranslations: vi.fn().mockResolvedValue((key: string) => key),
    }
})

describe("Footer server component", () => {
    it("invokes server component function and returns JSX", async () => {
        const mod = await import("@/components/layout/footer")
        const el = await mod.default({ locale: "en" } as any)
        expect(React.isValidElement(el)).toBe(true)
    })
})
