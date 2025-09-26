import { expect, test } from "@playwright/test"

test.describe("home page - structured data", () => {
    test("renders JSON-LD scripts for person and website and custom data", async ({
        page,
    }) => {
        await page.goto("/en")

        // There should be multiple application/ld+json scripts
        const ldNodes = page.locator('script[type="application/ld+json"]')
        const count = await ldNodes.count()
        expect(count).toBeGreaterThan(1)

        // Validate that at least one contains "@type":"ProfilePage" (customData)
        const hasProfilePage = await ldNodes.evaluateAll(nodes =>
            nodes.some(n => {
                try {
                    const json = JSON.parse(n.textContent || "{}")
                    return (
                        json["@type"] === "ProfilePage" ||
                        (Array.isArray(json) &&
                            json.some(
                                (j: any) => j?.["@type"] === "ProfilePage"
                            ))
                    )
                } catch {
                    return false
                }
            })
        )
        expect(hasProfilePage).toBe(true)
    })
})
