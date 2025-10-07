import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl", () => ({
    useMessages: () => ({
        ns: { key: "value" },
    }),
}))

describe("useNamespace hook full coverage", () => {
    it("returns namespace object when present", async () => {
        const mod = await import("@/lib/i18n-helpers")
        const { result } = renderHook(() => mod.useNamespace("ns"))
        expect(result.current).toEqual({ key: "value" })
    })

    it("returns empty object when namespace missing", async () => {
        const mod = await import("@/lib/i18n-helpers")
        const { result } = renderHook(() => mod.useNamespace("missing"))
        expect(result.current).toEqual({})
    })
})
