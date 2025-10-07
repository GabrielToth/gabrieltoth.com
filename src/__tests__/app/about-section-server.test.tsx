import React from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    return {
        getTranslations: vi.fn().mockResolvedValue(
            Object.assign((k: string) => k, {
                raw: (_k: string) => ["A", "B"],
            }) as any
        ),
    }
})

describe("AboutSection server component", () => {
    it("renders JSX with minimal translations", async () => {
        const mod = await import("@/app/[locale]/home/about-section")
        const el = await mod.default({ params: { locale: "en" } } as any)
        expect(React.isValidElement(el)).toBe(true)
    })
})
