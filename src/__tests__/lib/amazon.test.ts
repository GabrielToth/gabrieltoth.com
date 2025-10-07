import { generateAmazonAffiliateLink } from "@/lib/amazon"
import { describe, expect, it } from "vitest"

describe("lib/amazon", () => {
    it("generates affiliate link for /dp pattern and preserves marketplace", () => {
        const url = "https://www.amazon.com/dp/B08N5WRWNW?ref_=abc"
        const out = generateAmazonAffiliateLink({ url, tag: "mytag-20" })
        expect(out).toMatch(/https:\/\/www\.amazon\.com\/dp\/B08N5WRWNW/)
        expect(out).toContain("tag=mytag-20")
        expect(out).toContain("ref_=abc")
    })

    it("handles gp/product pattern and normalizes ASIN", () => {
        const url = "https://www.amazon.co.uk/gp/product/b08n5wrwnw"
        const out = generateAmazonAffiliateLink({ url, tag: "mytag-21" })
        expect(out).toMatch(/https:\/\/www\.amazon\.co\.uk\/dp\/B08N5WRWNW/)
        expect(out).toContain("tag=mytag-21")
    })

    it("uses original path if ASIN missing and still applies tag", () => {
        const url = "https://www.amazon.de/s?k=headphones"
        const out = generateAmazonAffiliateLink({ url, tag: "tag-22" })
        expect(out).toMatch(/https:\/\/www\.amazon\.de\/s\?k=headphones/)
        expect(out).toContain("tag=tag-22")
    })
})
