import { describe, expect, it } from "vitest"

describe("lib/seo coverage", () => {
    it("generates SEO config with locale-prefixed canonical and keywords/robots", async () => {
        const { generateSeoConfig } = await import("@/lib/seo")
        const cfg = generateSeoConfig({ locale: "en" as any, path: "/about" })
        expect(cfg.canonical).toBe("https://www.gabrieltoth.com/en/about/")
        const keywords = (cfg.additionalMetaTags || []).find(
            (m: any) => m.name === "keywords"
        )
        expect(keywords?.content || "").toMatch(/full stack/i)
        const robots = (cfg.additionalMetaTags || []).find(
            (m: any) => m.name === "robots"
        )
        expect(robots?.content || "").toMatch(/index, follow/i)
    })

    it("applies noindex and custom og image", async () => {
        const { generateSeoConfig } = await import("@/lib/seo")
        const cfg = generateSeoConfig({
            locale: "pt-BR" as any,
            path: "/contato",
            noIndex: true,
            ogImage: "https://cdn/img.jpg",
        })
        const robots = (cfg.additionalMetaTags || []).find(
            (m: any) => m.name === "robots"
        )
        expect(robots?.content).toMatch(/noindex/)
        expect(cfg.openGraph?.images?.[0]?.url).toBe("https://cdn/img.jpg")
    })

    it("generates person/website/org/breadcrumb/faq structured data", async () => {
        const {
            generatePersonStructuredData,
            generateWebsiteStructuredData,
            generateOrganizationStructuredData,
            generateBreadcrumbStructuredData,
            generateFAQStructuredData,
        } = await import("@/lib/seo")
        expect(generatePersonStructuredData("en" as any)["@type"]).toBe(
            "Person"
        )
        expect(generateWebsiteStructuredData("en" as any)["@type"]).toBe(
            "WebSite"
        )
        expect(generateOrganizationStructuredData("en" as any)["@type"]).toBe(
            "Organization"
        )
        expect(
            generateBreadcrumbStructuredData([
                { name: "Home", url: "https://x/" },
            ])["@type"]
        ).toBe("BreadcrumbList")
        expect(
            generateFAQStructuredData("en" as any, [
                { question: "Q", answer: "A" },
            ])["@type"]
        ).toBe("FAQPage")
    })

    it("returns robots content string for robots.txt", async () => {
        const { generateRobotsContent } = await import("@/lib/seo")
        const txt = generateRobotsContent()
        expect(txt).toContain(
            "Sitemap: https://www.gabrieltoth.com/sitemap.xml"
        )
        expect(txt).toContain("User-agent: *")
    })
})
