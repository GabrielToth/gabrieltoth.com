import * as robots from "@/app/robots.txt/route"
import * as sitemap from "@/app/sitemap.xml/route"
import { describe, expect, it } from "vitest"

// @vitest-environment node

describe("app routes: robots & sitemap", () => {
    it("robots GET returns text/plain with content", async () => {
        const res = await robots.GET()
        const text = await (res as Response).text()
        expect((res as Response).headers.get("content-type")).toContain(
            "text/plain"
        )
        expect(text).toContain("Sitemap:")
    })

    it("robots HEAD returns 200", async () => {
        const res = await robots.HEAD()
        expect((res as Response).status).toBe(200)
    })

    it("sitemap GET returns xml with sitemaps", async () => {
        const res = await sitemap.GET()
        const text = await (res as Response).text()
        expect((res as Response).headers.get("content-type")).toContain(
            "application/xml"
        )
        expect(text).toContain("sitemapindex")
        expect(text).toContain("sitemap-en.xml")
    })

    it("sitemap HEAD returns 200", async () => {
        const res = await sitemap.HEAD()
        expect((res as Response).status).toBe(200)
    })
})
