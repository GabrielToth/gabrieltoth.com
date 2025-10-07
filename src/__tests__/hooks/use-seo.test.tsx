import * as useLocaleModule from "@/hooks/use-locale"
import {
    useArticleSeo,
    useFAQSeo,
    useSeo,
    useServiceSeo,
} from "@/hooks/use-seo"
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/en/projects" }))

describe("hooks/use-seo", () => {
    it("builds nextSeoConfig and breadcrumbs", () => {
        vi.spyOn(useLocaleModule, "useLocale").mockReturnValue({
            locale: "en",
            changeLocale: vi.fn(),
            isLoading: false,
        } as any)

        const { result } = renderHook(() =>
            useSeo({ title: "Projects", path: "/projects" })
        )
        expect(result.current.nextSeoConfig.title).toBe("Projects")
        expect(result.current.canonical).toMatch(/\/en\/projects\//)
        expect(result.current.breadcrumbs?.length).toBeGreaterThan(0)
    })

    it("provides specialized hooks wrappers", () => {
        vi.spyOn(useLocaleModule, "useLocale").mockReturnValue({
            locale: "en",
            changeLocale: vi.fn(),
            isLoading: false,
        } as any)
        expect(
            renderHook(() => useFAQSeo([{ question: "q", answer: "a" }])).result
                .current.nextSeoConfig
        ).toBeTruthy()
        expect(
            renderHook(() => useServiceSeo({ any: true })).result.current
                .nextSeoConfig
        ).toBeTruthy()
        expect(
            renderHook(() => useArticleSeo({ any: true })).result.current
                .nextSeoConfig
        ).toBeTruthy()
    })
})
