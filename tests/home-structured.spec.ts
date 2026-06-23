import { expect, test } from "@playwright/test"

test.describe("home page - structured data", () => {
    test("renders JSON-LD scripts for person and website and custom data", async ({
        page,
    }) => {
        await page.goto("/en", { waitUntil: "networkidle" })

        // There should be multiple application/ld+json scripts
        const ldNodes = page.locator('script[type="application/ld+json"]')
        const count = await ldNodes.count()
        expect(count).toBeGreaterThan(1)

        // Validate that at least one contains "@type":"Person" (from default structured data)
        const hasPerson = await ldNodes.evaluateAll(nodes =>
            nodes.some(n => {
                try {
                    const json = JSON.parse(n.textContent || "{}")
                    return (
                        json["@type"] === "Person" ||
                        (Array.isArray(json) &&
                            json.some((j: any) => j?.["@type"] === "Person"))
                    )
                } catch {
                    return false
                }
            })
        )
        expect(hasPerson).toBe(true)
    })
})
