import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
    usePathname: () => "/en/pc-optimization/terms",
}))
vi.mock("@/hooks/use-locale", () => ({ useLocale: () => ({ locale: "en" }) }))
vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k }))
vi.mock("next/link", () => ({
    __esModule: true,
    default: ({ href, children }: any) => (
        <a href={typeof href === "string" ? href : String(href)}>{children}</a>
    ),
}))

describe("ui/breadcrumbs branches", () => {
    it("auto-generates items with home injected and custom separator", async () => {
        const mod = await import("@/components/ui/breadcrumbs")
        render(
            React.createElement(mod.default as any, {
                separator: React.createElement("span", null, ">"),
            })
        )
        expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument()
        expect(
            screen.getByText(/layout\.header\.home|home/i)
        ).toBeInTheDocument()
    })

    it("honors hideHome when provided items", async () => {
        const mod = await import("@/components/ui/breadcrumbs")
        render(
            React.createElement(mod.default as any, {
                items: [
                    { name: "Root", href: "/" },
                    { name: "PC", href: "/pc-optimization", current: false },
                ],
                hideHome: true,
            })
        )
        expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument()
        // Should not inject home
        expect(screen.queryByText(/home/i)).toBeFalsy()
    })

    it("returns null on homepage when items not provided", async () => {
        vi.resetModules()
        vi.doMock("next/navigation", () => ({ usePathname: () => "/en" }))
        vi.doMock("@/hooks/use-locale", () => ({
            useLocale: () => ({ locale: "en" }),
        }))
        vi.doMock("next-intl", () => ({
            useTranslations: () => (k: string) => k,
        }))
        vi.doMock("next/link", () => ({
            __esModule: true,
            default: ({ href, children }: any) => (
                <a href={typeof href === "string" ? href : String(href)}>
                    {children}
                </a>
            ),
        }))

        const mod = await import("@/components/ui/breadcrumbs")
        const { container } = render(
            React.createElement(mod.default as any, {})
        )
        expect(container.firstChild).toBeNull()
    })

    it("normalizes external URLs and sets aria-current on last item", async () => {
        const mod = await import("@/components/ui/breadcrumbs")
        const { container } = render(
            React.createElement(mod.default as any, {
                items: [
                    { name: "Ext", href: "https://example.com/abc/def" },
                    { name: "Inner", href: "/foo" },
                    { name: "Last", href: "/bar", current: true },
                ],
            })
        )
        const extLink = screen.getByRole("link", {
            name: "Ext",
        }) as HTMLAnchorElement
        expect(extLink.getAttribute("href") || "").toContain("/en/abc/def")

        const current = container.querySelector('[aria-current="page"]')
        expect(current?.textContent || "").toMatch(/Last/)
    })

    it("renders Home as last item and shows icon", async () => {
        const mod = await import("@/components/ui/breadcrumbs")
        const { container } = render(
            React.createElement(mod.default as any, {
                items: [
                    {
                        name: "home",
                        href: "/",
                        current: true,
                    },
                ],
            })
        )
        const current = container.querySelector('[aria-current="page"]')
        expect(current).toBeTruthy()
        // Should include an inline SVG icon (Home)
        expect(current?.querySelector("svg")).toBeTruthy()
    })
})
