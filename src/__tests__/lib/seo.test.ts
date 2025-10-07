import {
    generateBreadcrumbStructuredData,
    generateFAQStructuredData,
    generateOrganizationStructuredData,
    generatePersonStructuredData,
    generateSeoConfig,
    generateWebsiteStructuredData,
} from "@/lib/seo"
import { describe, expect, it } from "vitest"

describe("lib/seo", () => {
    it("generateSeoConfig builds canonical and og/twitter config", () => {
        const cfg = generateSeoConfig({
            locale: "en",
            path: "/projects",
            title: "Projects",
            description: "Desc",
            keywords: ["k1"],
        })
        expect(cfg.canonical).toMatch(
            /https:\/\/www\.gabrieltoth\.com\/en\/projects\//
        )
        expect(cfg.openGraph?.title).toBe("Projects")
        expect(cfg.twitter?.title).toBe("Projects")
        expect(
            cfg.additionalMetaTags?.some(m => (m as any).name === "keywords")
        ).toBe(true)
    })

    it("generatePersonStructuredData returns Person schema", () => {
        const data = generatePersonStructuredData("en")
        expect(data["@type"]).toBe("Person")
        expect(data.name).toContain("Gabriel Toth")
    })

    it("generateWebsiteStructuredData returns WebSite schema", () => {
        const data = generateWebsiteStructuredData("en")
        expect(data["@type"]).toBe("WebSite")
        expect(data.name).toBeTruthy()
    })

    it("generateOrganizationStructuredData returns Organization schema", () => {
        const data = generateOrganizationStructuredData("en")
        expect(data["@type"]).toBe("Organization")
        expect(data.url).toMatch(/^https:/)
    })

    it("generateBreadcrumbStructuredData builds breadcrumb list", () => {
        const data = generateBreadcrumbStructuredData([
            { name: "Home", url: "https://example.com/" },
            { name: "Projects", url: "https://example.com/projects" },
        ])
        expect(data["@type"]).toBe("BreadcrumbList")
        expect(data.itemListElement.length).toBe(2)
    })

    it("generateFAQStructuredData builds faq list", () => {
        const data = generateFAQStructuredData("en", [
            { question: "Q1", answer: "A1" },
            { question: "Q2", answer: "A2" },
        ])
        expect(data["@type"]).toBe("FAQPage")
        expect(data.mainEntity.length).toBe(2)
    })
})
