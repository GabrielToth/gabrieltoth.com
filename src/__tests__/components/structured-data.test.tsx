import StructuredData from "@/components/seo/structured-data"
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

describe("StructuredData", () => {
    it("renders person and website script tags and custom data", () => {
        const { container } = render(
            <StructuredData
                locale="en"
                type="all"
                customData={{ "@type": "ProfilePage" }}
            />
        )
        const scripts = container.querySelectorAll(
            'script[type="application/ld+json"]'
        )
        expect(scripts.length).toBeGreaterThan(1)

        const hasProfilePage = Array.from(scripts).some(s => {
            try {
                const json = JSON.parse(s.textContent || "{}")
                return json["@type"] === "ProfilePage"
            } catch {
                return false
            }
        })
        expect(hasProfilePage).toBe(true)
    })
})
