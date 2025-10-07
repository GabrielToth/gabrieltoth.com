import { useContactForm } from "@/hooks/use-contact-form"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

describe("useContactForm", () => {
    it("initial status is idle and can set to success", () => {
        const { result } = renderHook(() => useContactForm())
        expect(result.current.status).toBe("idle")
        act(() => result.current.setStatus("success"))
        expect(result.current.status).toBe("success")
    })
})
