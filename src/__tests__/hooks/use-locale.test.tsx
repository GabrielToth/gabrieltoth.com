import { useLocale } from "@/hooks/use-locale"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", async orig => {
    const actual = await (orig as any)()
    return {
        ...actual,
        usePathname: () => "/en/projects",
        useRouter: () => ({ push: vi.fn() }),
    }
})

describe("hooks/use-locale", () => {
    beforeEach(() => {
        // reset cookie
        // @ts-ignore
        Object.defineProperty(document, "cookie", { writable: true, value: "" })
    })

    it("initializes locale from pathname and updates on changeLocale", () => {
        const { result } = renderHook(() => useLocale())
        expect(result.current.locale).toBe("en")

        act(() => result.current.changeLocale("pt-BR"))
        expect(result.current.locale).toBe("pt-BR")
    })
})
