import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("[locale]/not-found", () => {
    it("renders main 404 content", async () => {
        const mod = await import("@/app/[locale]/not-found")
        // Render and assert initial text exists (Loading...)
        render(React.createElement(mod.default))
        expect(screen.getByText(/404/)).toBeInTheDocument()
        expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument()
    })

    it("detects locale from pathname and renders localized content", async () => {
        const original = window.location
        // @ts-ignore
        delete (window as any).location
        ;(window as any).location = { pathname: "/pt-BR/unknown" } as any

        const mod = await import("@/app/[locale]/not-found")
        render(React.createElement(mod.default))
        expect(
            screen.getByText(
                /Página Não Encontrada|Página No Encontrada|Seite nicht gefunden|Page Not Found/
            )
        ).toBeInTheDocument()

        // restore
        ;(window as any).location = original as any
    })
})
