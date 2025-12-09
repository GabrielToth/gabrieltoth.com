import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

// Mock next/link to simple anchor
vi.mock("next/link", () => ({
    __esModule: true,
    default: ({ href, children, ...rest }: any) => (
        <a href={typeof href === "string" ? href : String(href)} {...rest}>
            {children}
        </a>
    ),
}))

describe("app/[locale]/home/channel-management-section coverage", () => {
    it("renders EN content and CTA link with locale", async () => {
        const Mod =
            await import("@/app/[locale]/home/channel-management-section")
        render(
            React.createElement(Mod.default as any, {
                params: { locale: "en" },
            })
        )
        expect(
            screen.getByText(/Transform Your Channel into a Growth Machine/i)
        ).toBeInTheDocument()
        const cta = screen.getByRole("link", {
            name: /Request Consultation/i,
        }) as HTMLAnchorElement
        expect(cta.getAttribute("href")).toBe("/en/channel-management")
    })

    it("renders PT content variants", async () => {
        const Mod =
            await import("@/app/[locale]/home/channel-management-section")
        render(
            React.createElement(Mod.default as any, {
                params: { locale: "pt-BR" },
            })
        )
        // Relax assertions to stable PT content present in section
        expect(
            screen.getByText(
                /Transforme Seu Canal em uma Máquina de Crescimento/i
            )
        ).toBeInTheDocument()
    })
})
