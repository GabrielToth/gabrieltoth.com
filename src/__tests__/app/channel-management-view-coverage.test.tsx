import ChannelManagementView from "@/app/[locale]/channel-management/channel-management-view"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { render } from "@testing-library/react"
import { act } from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl", () => ({
    useTranslations: () => {
        return Object.assign((key: string) => key, {
            raw: (key: string) => {
                if (key.endsWith("hero.stats")) {
                    return [
                        { number: "1M+", label: "views" },
                        { number: "100k+", label: "subs" },
                        { number: "500+", label: "videos" },
                    ]
                }
                if (key.endsWith("personalAbout.skills")) {
                    return [
                        "Analytics",
                        "Video",
                        "Revenue",
                        "Growth",
                        "YT",
                        "Target",
                    ]
                }
                if (key.endsWith("problems.items")) {
                    return [
                        { title: "Low views", description: "desc" },
                        { title: "Low growth", description: "desc" },
                        { title: "Low revenue", description: "desc" },
                        { title: "No strategy", description: "desc" },
                    ]
                }
                if (key.endsWith("services.items")) {
                    return [
                        {
                            title: "Starter",
                            description: "desc",
                            features: ["a", "b"],
                            price: 10,
                        },
                        {
                            title: "Pro",
                            description: "desc",
                            features: ["a", "b"],
                            price: 20,
                        },
                        {
                            title: "Elite",
                            description: "desc",
                            features: ["a", "b"],
                            price: 30,
                        },
                    ]
                }
                if (key.endsWith("results.items")) {
                    return [
                        {
                            name: "A",
                            role: "Creator",
                            content: "Great",
                            rating: 5,
                        },
                        {
                            name: "B",
                            role: "Creator",
                            content: "Great",
                            rating: 4,
                        },
                    ]
                }
                if (key.endsWith("testimonials.items")) {
                    return [
                        {
                            name: "C",
                            role: "Creator",
                            content: "Nice",
                            rating: 5,
                        },
                        {
                            name: "D",
                            role: "Creator",
                            content: "Nice",
                            rating: 4,
                        },
                    ]
                }
                if (key.endsWith("pricing.plans")) {
                    return [
                        {
                            name: "Basic",
                            basePrice: 100,
                            description: "d",
                            features: ["f"],
                        },
                        {
                            name: "Popular",
                            basePrice: 200,
                            description: "d",
                            features: ["f"],
                            popular: true,
                        },
                        {
                            name: "Top",
                            basePrice: 300,
                            description: "d",
                            features: ["f"],
                        },
                    ]
                }
                return []
            },
        })
    },
}))

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: () => {},
        replace: () => {},
        prefetch: () => {},
        back: () => {},
    }),
    usePathname: () => "/en",
    useSearchParams: () => new URLSearchParams(),
}))

vi.mock(
    "@/app/[locale]/channel-management/channel-management-calculate-price",
    () => ({
        useCalculatePrice: () => ({
            calculatePrice: (base: number) => ({
                current: base,
                original: base + 10,
                currency: "$",
                displayPrice: String(base),
                originalPrice: String(base + 10),
                isMonero: true,
            }),
        }),
    })
)

describe("channel-management-view coverage", () => {
    it("renders all sections without crashing", async () => {
        let container: HTMLElement | null = null
        await act(async () => {
            const res = render(
                <ThemeProvider>
                    <ChannelManagementView locale={"en" as any} />
                </ThemeProvider>
            )
            container = res.container
        })
        expect(container).toBeTruthy()
    })
})
