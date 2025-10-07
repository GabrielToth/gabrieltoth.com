import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/en/page" }))
vi.mock("@/hooks/use-locale", () => ({ useLocale: () => ({ locale: "en" }) }))
vi.mock("@/components/ui/breadcrumbs", () => ({
    getBreadcrumbsForStructuredData: (pathname: string, locale: string) => [
        { name: "Home", url: `https://x/${locale}` },
        { name: "Page", url: `https://x/${locale}${pathname}` },
    ],
}))

describe("hooks/use-seo coverage", () => {
    it("builds nextSeoConfig and structured data with auto breadcrumbs", async () => {
        const { useSeo } = await import("@/hooks/use-seo")
        const { result } = renderHook(() =>
            useSeo({ title: "T", description: "D", path: "/p" })
        )
        expect(result.current.nextSeoConfig.title).toBeTruthy()
        expect(result.current.breadcrumbs.length).toBeGreaterThan(0)
        expect(result.current.canonical).toMatch(
            /https:\/\/www\.gabrieltoth\.com\/en/
        )
    })

    it("honors custom openGraph and structured data options", async () => {
        const { useSeo } = await import("@/hooks/use-seo")
        const { result } = renderHook(() =>
            useSeo({
                customOpenGraph: { type: "article" },
                customStructuredData: { any: true },
                structuredDataType: "all",
                autoBreadcrumbs: false,
            })
        )
        expect(result.current.nextSeoConfig.openGraph?.type).toBe("article")
        expect(result.current.structuredDataProps.type).toBe("all")
        expect(result.current.breadcrumbs).toEqual([])
    })
})
