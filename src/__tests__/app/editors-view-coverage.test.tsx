import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl", () => ({
    useTranslations: () => {
        const t = (key: string) => key
        ;(t as any).raw = (key: string) => {
            if (key === "hero.stats") {
                return [
                    { number: "10+", label: "Years" },
                    { number: "50+", label: "Projects" },
                    { number: "100%", label: "Quality" },
                ]
            }
            if (key === "about.skills") {
                return [{ iconName: "Home", name: "Skill" }]
            }
            if (key === "tools.items") {
                return [{ iconName: "Home", name: "Tool", description: "desc" }]
            }
            if (key === "requirements.items") {
                return [
                    {
                        iconName: "Home",
                        title: "T",
                        description: "D",
                        features: ["f1"],
                    },
                ]
            }
            if (key === "benefits.items") {
                return [{ title: "B", description: "D", iconName: "Home" }]
            }
            return []
        }
        return t as any
    },
}))

vi.mock("@/components/ui/language-selector", () => ({
    default: () => null,
}))

vi.mock("@/components/ui/whatsapp-button", () => ({
    default: ({ children }: any) =>
        React.createElement("button", null, children),
}))

describe("editors view coverage", () => {
    it("renders sections with mocked translations", async () => {
        const mod = await import("@/app/[locale]/editors/editors-view")
        render(React.createElement(mod.HeroSection as any, { locale: "en" }))
        render(React.createElement(mod.AboutSection as any))
        render(React.createElement(mod.ToolsSection as any))
        render(React.createElement(mod.RequirementsSection as any))
        render(React.createElement(mod.BenefitsSection as any))
        render(React.createElement(mod.CTASection as any, { locale: "en" }))
        expect(screen.getAllByRole("button").length).toBeGreaterThan(0)
    })
})
