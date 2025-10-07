import { render, screen } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/layout/language-selector-wrapper", () => ({
    __esModule: true,
    default: () => <div data-testid="lang-selector" />,
}))

vi.mock("@/components/ui/pricing-toggle", () => ({
    __esModule: true,
    default: ({ locale }: { locale: string }) => (
        <div data-testid="pricing-toggle">{locale}</div>
    ),
}))

vi.mock("@/app/[locale]/pc-optimization/pc-optimization-whatsapp", () => ({
    generatePCOptimizationWhatsAppMessage: () => "https://wa.me/TEST",
}))

vi.mock("@/hooks/use-monero-pricing", () => ({
    useMoneroPricing: () => ({
        calculatePrice: (basePrice: number, _locale: string) => {
            if (basePrice === 200) {
                return {
                    isMonero: true,
                    discount: 10,
                    currency: "R$",
                    originalPrice: 220,
                    displayPrice: 198,
                }
            }
            return {
                isMonero: false,
                discount: 0,
                currency: "R$",
                displayPrice: basePrice,
            } as any
        },
    }),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => {
        const t: any = (key: string) => key
        t.raw = (key: string) => {
            switch (key) {
                case "pcOptimization.hero.stats":
                case "hero.stats":
                    return [
                        { value: "+120%", label: "FPS" },
                        { value: "-30%", label: "Input Lag" },
                        { value: "0%", label: "Crashes" },
                        { value: "+99%", label: "Stability" },
                    ]
                case "pcOptimization.features.list":
                case "features.list":
                    return [
                        { title: "Feat A", description: "Desc A" },
                        { title: "Feat B", description: "Desc B" },
                        { title: "Feat C", description: "Desc C" },
                        { title: "Feat D", description: "Desc D" },
                        { title: "Feat E", description: "Desc E" }, // fallback icon branch
                    ]
                case "pcOptimization.pricing.plans":
                case "pricing.plans":
                    return [
                        {
                            name: "Basic",
                            basePrice: 100,
                            description: "Basic plan",
                            features: ["f1", "f2"],
                        },
                        {
                            name: "Pro",
                            basePrice: 200,
                            description: "Pro plan",
                            features: ["f1", "f2", "f3"],
                            popular: true,
                        },
                    ]
                case "pcOptimization.testimonials.items":
                case "testimonials.items":
                    return [
                        {
                            name: "Alice",
                            role: "Gamer",
                            content: "Great!",
                            rating: 3,
                        },
                        {
                            name: "Bob",
                            role: "Streamer",
                            content: "Nice!",
                            rating: 0,
                        },
                    ]
                default:
                    return []
            }
        }
        return t
    },
}))

describe("pc-optimization view coverage", () => {
    beforeEach(() => {
        ;(console as any).error = vi.fn()
    })

    it("renders sections, features, pricing (with badges) and CTA links", async () => {
        const Mod = await import(
            "@/app/[locale]/pc-optimization/pc-optimization-view"
        )
        const { container } = render(<Mod.default locale="en" />)

        // Language selector and pricing toggle stubs
        expect(screen.getByTestId("lang-selector")).toBeInTheDocument()
        expect(screen.getByTestId("pricing-toggle")).toHaveTextContent("en")

        // Hero stats from raw
        expect(screen.getByText("+120%"))
        expect(screen.getByText("FPS"))

        // Features list including fallback icon branch
        expect(screen.getByText("Feat A"))
        expect(screen.getByText("Desc E"))

        // Pricing cards: one with discount/original price and popular badge
        expect(screen.getByText("Pro"))
        expect(screen.getByText("-10%"))
        expect(container.textContent).toContain("R$ 220")

        // WhatsApp links (hero + CTA)
        const links = container.querySelectorAll('a[href="https://wa.me/TEST"]')
        expect(links.length).toBeGreaterThanOrEqual(2)

        // Testimonials rendered
        expect(screen.getByText("Alice"))
        expect(screen.getByText("Bob"))
    })
})
