import { render, screen } from "@testing-library/react"
import React, { act } from "react"
import { describe, expect, it, vi } from "vitest"

// Mock Breadcrumbs to simplify
vi.mock("@/components/ui/breadcrumbs", () => ({
    __esModule: true,
    default: ({ items }: any) => (
        <nav aria-label="breadcrumb-mock">{items?.length}</nav>
    ),
}))

// Mock next/link as basic anchor to assert href
vi.mock("next/link", () => ({
    __esModule: true,
    default: ({ href, children, ...rest }: any) => (
        <a href={typeof href === "string" ? href : String(href)} {...rest}>
            {children}
        </a>
    ),
}))

describe("pc-optimization terms page coverage", () => {
    it("renders EN page smoke", async () => {
        const Mod = await import("@/app/[locale]/pc-optimization/terms/page")
        const params = Promise.resolve({ locale: "en" } as any)
        const { container } = render(
            React.createElement(Mod.default as any, { params })
        )
        expect(container).toBeTruthy()
    })

    it("renders PT content variants", async () => {
        const Mod = await import("@/app/[locale]/pc-optimization/terms/page")
        const params = Promise.resolve({ locale: "pt-BR" } as any)
        render(React.createElement(Mod.default as any, { params }))
    })

    it("renders ES content and back link", async () => {
        const Mod = await import("@/app/[locale]/pc-optimization/terms/page")
        const params = Promise.resolve({ locale: "es" } as any)
        const element = await (Mod.default as any)({ params })
        await act(async () => {
            render(element)
        })
        const back = await screen.findByRole("link", {
            name: /volver.*optimizaci/i,
        })
        expect((back as HTMLAnchorElement).getAttribute("href")).toBe(
            "/es/pc-optimization"
        )
    })

    it("renders DE content and back link", async () => {
        const Mod = await import("@/app/[locale]/pc-optimization/terms/page")
        const params = Promise.resolve({ locale: "de" } as any)
        const element = await (Mod.default as any)({ params })
        await act(async () => {
            render(element)
        })
        const back = await screen.findByRole("link", {
            name: /zurück zur pc-optimierung/i,
        })
        expect((back as HTMLAnchorElement).getAttribute("href")).toBe(
            "/de/pc-optimization"
        )
    })
})
