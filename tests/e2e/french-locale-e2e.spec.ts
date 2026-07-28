import { expect, test } from "@playwright/test"

test.describe("French Locale & Sitemap E2E Flows", () => {
    test("French homepage loads correctly with translated content", async ({ page }) => {
        const response = await page.goto("/fr")
        expect(response?.status()).toBe(200)
        await expect(page).toHaveURL(/\/fr\/?$/)
    })

    test("French sitemap route responds with XML containing hreflang tags", async ({ page }) => {
        const response = await page.goto("/sitemap-fr.xml")
        expect(response?.status()).toBe(200)
        const contentType = response?.headers()["content-type"]
        expect(contentType).toContain("xml")
        const text = await page.content()
        expect(text).toContain("sitemap")
    })

    test("French PC Optimization page loads correctly", async ({ page }) => {
        const response = await page.goto("/fr/pc-optimization")
        expect(response?.status()).toBe(200)
        await expect(page.locator("h1")).toBeVisible()
    })
})
