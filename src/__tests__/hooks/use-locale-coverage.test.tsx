import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const pushSpy = vi.fn()
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushSpy }),
    usePathname: () => "/en/page",
}))

vi.mock("@/lib/i18n", async importOriginal => {
    const actual: any = await importOriginal<any>()
    return {
        __esModule: true,
        ...actual,
        getLocaleFromCookie: vi.fn(() => "en"),
        detectBrowserLanguage: vi.fn(() => "en"),
        setLocaleCookie: vi.fn(),
    }
})

describe("hooks/use-locale coverage", () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it("initializes from pathname and notifies changeLocale to replace first segment", async () => {
        const { useLocale } = await import("@/hooks/use-locale")
        const { result } = renderHook(() => useLocale())

        expect(result.current.locale).toBe("en")

        // Change locale should push new path replacing first segment
        const { usePathname } = (await import("next/navigation")) as any
        const pathname = usePathname()
        expect(pathname).toBe("/en/page")

        act(() => {
            result.current.changeLocale("pt-BR" as any)
        })
        expect(pushSpy).toHaveBeenCalledWith("/pt-BR/page")
    })

    it("adds locale to path when current path has no locale", async () => {
        const pushSpy2 = vi.fn()
        vi.doMock("next/navigation", () => ({
            useRouter: () => ({ push: pushSpy2 }),
            usePathname: () => "/plain",
        }))
        const { useLocale } = await import("@/hooks/use-locale")
        const { result } = renderHook(() => useLocale())
        act(() => {
            result.current.changeLocale("es" as any)
        })
        expect(pushSpy2).toHaveBeenCalledWith("/es/plain")
    })
})
