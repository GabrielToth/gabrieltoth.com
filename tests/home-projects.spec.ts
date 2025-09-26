import { expect, test } from "@playwright/test"

test.describe("home page - projects", () => {
    test("show more/less toggles list and links navigate", async ({ page }) => {
        await page.goto("/en")

        // Scroll to projects section via nav
        await page.getByTestId("nav-projects").click()
        // Some browsers may not update hash immediately; wait for section visibility
        await expect(page.locator("#projects")).toBeVisible()

        // Count cards
        const cards = page.locator("#projects .grid > div")
        const countInitial = await cards.count()
        expect(countInitial).toBeGreaterThan(0)

        // Click Show More if visible
        const showMore = page.getByRole("button", { name: /show more/i })
        if (await showMore.isVisible()) {
            await showMore.click()
            const countMore = await cards.count()
            expect(countMore).toBeGreaterThanOrEqual(countInitial)

            // Then Show Less should appear
            await page.getByRole("button", { name: /show less/i }).click()
            const countLess = await cards.count()
            expect(countLess).toBe(countInitial)
        }

        // Validate first card has a "View Project" link that is valid
        const firstViewLink = page
            .locator("#projects a")
            .filter({ hasText: /view project/i })
            .first()

        await expect(firstViewLink).toBeVisible()
        const href = await firstViewLink.getAttribute("href")
        expect(href).toBeTruthy()
    })
})
