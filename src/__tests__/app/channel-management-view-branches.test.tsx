import ChannelManagementView from "@/app/[locale]/channel-management/channel-management-view"
import { render } from "@testing-library/react"
import React from "react"
import { describe, it, vi } from "vitest"
// Mock router-dependent components to avoid Next App Router invariant
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => "/en",
    useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@/components/layout/language-selector-wrapper", () => ({
    __esModule: true,
    default: () => <div data-testid="lsw" />,
}))

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
                    // 7 items to trigger fallback icon (icons length = 6)
                    return [
                        "Analytics",
                        "Video",
                        "Revenue",
                        "Growth",
                        "YT",
                        "Target",
                        "Extra",
                    ]
                }
                if (key.endsWith("problems.items")) {
                    // 5 items to trigger fallback icon (icons length = 4)
                    return [
                        { title: "Low views", description: "d" },
                        { title: "Low growth", description: "d" },
                        { title: "Low revenue", description: "d" },
                        { title: "No strategy", description: "d" },
                        { title: "Extra", description: "d" },
                    ]
                }
                if (key.endsWith("services.items")) {
                    // 5 items to trigger fallback icon (icons length = 4)
                    return [
                        {
                            title: "A",
                            description: "d",
                            features: ["f"],
                            price: 10,
                        },
                        {
                            title: "B",
                            description: "d",
                            features: ["f"],
                            price: 20,
                        },
                        {
                            title: "C",
                            description: "d",
                            features: ["f"],
                            price: 30,
                        },
                        {
                            title: "D",
                            description: "d",
                            features: ["f"],
                            price: 40,
                        },
                        {
                            title: "E",
                            description: "d",
                            features: ["f"],
                            price: 50,
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
                    ]
                }
                if (key.endsWith("pricing.plans")) {
                    return [
                        {
                            name: "Popular",
                            basePrice: 200,
                            description: "d",
                            features: ["f"],
                            popular: true,
                        },
                    ]
                }
                return []
            },
        })
    },
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

describe("channel-management-view branches", () => {
    it("renders with extra items to exercise fallback icons", () => {
        const { container } = render(
            React.createElement(ChannelManagementView as any, {
                locale: "en",
            })
        )
        expect(container).toBeTruthy()
    })
})
