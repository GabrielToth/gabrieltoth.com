import { expect, test } from "@playwright/test"

test.describe("home page - footer", () => {
    test("legal links navigate to privacy and terms localized routes", async ({
        page,
    }) => {
        await page.goto("/en")

        // Scroll to bottom and click Privacy
        const privacy = page.getByRole("link", { name: /privacy/i }).first()
        await expect(privacy).toBeVisible()
        await privacy.click()
        await expect(page).toHaveURL(/\/en\/privacy-policy$/)

        // Go back then click Terms
        await page.goto("/en")
        const terms = page.getByRole("link", { name: /terms/i }).first()
        await expect(terms).toBeVisible()
        await terms.click()
        await expect(page).toHaveURL(/\/en\/terms-of-service$/)
    })
})
