import { describe, expect, it } from "vitest"

describe("lib/amazon coverage", () => {
    it("generates affiliate link preserving marketplace and ASIN from /dp", async () => {
        const { generateAmazonAffiliateLink } = await import("@/lib/amazon")
        const out = generateAmazonAffiliateLink({
            url: "https://www.amazon.com/dp/B09ABCDEF1?ref_=abc",
            tag: "mytag-20",
        })
        expect(out).toContain("/dp/B09ABCDEF1")
        expect(out).toContain("tag=mytag-20")
        expect(out).toContain("ref_=") // original param preserved
    })

    it("derives ASIN from /gp/product and preserves host", async () => {
        const { generateAmazonAffiliateLink } = await import("@/lib/amazon")
        const out = generateAmazonAffiliateLink({
            url: "https://www.amazon.com.br/gp/product/b08xyzpqrs",
            tag: "tag-21",
        })
        expect(out.startsWith("https://www.amazon.com.br/dp/B08XYZPQRS")).toBe(
            true
        )
        expect(out).toContain("tag=tag-21")
    })

    it("keeps original path when ASIN is missing and sets tag", async () => {
        const { generateAmazonAffiliateLink } = await import("@/lib/amazon")
        const out = generateAmazonAffiliateLink({
            url: "https://www.amazon.es/s?k=mouse",
            tag: "tag-22",
        })
        expect(out).toContain("/s?k=mouse")
        expect(out).toContain("tag=tag-22")
    })
})
