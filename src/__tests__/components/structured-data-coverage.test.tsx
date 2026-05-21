import { render } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("StructuredData component coverage", () => {
    it("renders multiple JSON-LD blocks for 'all' with custom, breadcrumbs and faqs", async () => {
        const mod = await import("@/components/seo/structured-data")
        const breadcrumbs = [
            { name: "Home", url: "/" },
            { name: "PC", url: "/pc-optimization" },
        ]
        const faqs = [{ question: "Q1", answer: "A1" }]
        const { container } = render(
            React.createElement(mod.default as any, {
                locale: "en",
                type: "all",
                customData: [{ any: 1 }, { other: 2 }],
                breadcrumbs,
                faqs,
            })
        )
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]'
        )
        expect(scripts.length).toBeGreaterThan(1)
    })
})
