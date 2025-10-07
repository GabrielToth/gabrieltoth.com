import React from "react"
import { describe, expect, it } from "vitest"

describe("ThemeScript", () => {
    it("exports ThemeScript function", async () => {
        const mod = await import("@/components/theme/theme-script")
        const el = mod.ThemeScript()
        expect(React.isValidElement(el)).toBe(true)
    })
})
