import { renderHook, act } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => "/en/home",
}))

vi.mock("@/lib/i18n", async importOriginal => {
    const actual = (await importOriginal()) as any
    return {
        ...actual,
        setLocaleCookie: vi.fn(),
        getLocaleFromCookie: vi.fn(() => actual.defaultLocale),
        detectBrowserLanguage: vi.fn(() => actual.defaultLocale),
    }
})

describe("useLocale branches", () => {
    it("initializes from pathname and updates via changeLocale", async () => {
        const { useLocale } = await import("@/hooks/use-locale")
        const { result } = renderHook(() => useLocale())

        expect(result.current.locale).toBe("en")
        expect(result.current.isLoading).toBe(false)

        act(() => {
            result.current.changeLocale("pt-BR" as any)
        })
        expect(result.current.locale).toBe("pt-BR")
    })
})
