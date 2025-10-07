import React from "react"
import { describe, expect, it, vi } from "vitest"

// Stub UI dependencies to simplify rendering
vi.mock("@/components/ui/breadcrumbs", () => ({
    __esModule: true,
    default: ({ items }: any) => (
        <nav aria-label="waveigl-bc" data-count={items?.length || 0} />
    ),
}))
vi.mock("@/components/layout/language-selector-wrapper", () => ({
    __esModule: true,
    default: () => <div data-testid="lsw" />,
}))
vi.mock("@/components/seo/structured-data", () => ({
    __esModule: true,
    default: () => <div data-testid="sd" />,
}))
vi.mock("@/components/layout/footer", () => ({
    __esModule: true,
    default: () => <footer data-testid="footer" />,
}))

describe("waveigl-support page coverage", () => {
    it("imports module and has default export", async () => {
        const mod = await import("@/app/[locale]/waveigl-support/page")
        expect(mod.default).toBeTruthy()
        expect(typeof mod.revalidate).toBe("number")
    })

    it("has metadata generator reexported", async () => {
        const mod = await import("@/app/[locale]/waveigl-support/page")
        expect(mod.generateMetadata).toBeDefined()
    })
})
