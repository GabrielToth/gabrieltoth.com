import { expect, test } from "@playwright/test"

test.describe("home page - projects", () => {
    test("home page loads with header navigation", async ({ page }) => {
        await page.goto("/en", { waitUntil: "networkidle" })

        // Verify the page loaded with header navigation elements
        await expect(page.getByTestId("nav-home")).toBeVisible()
        await expect(page.getByTestId("nav-home-desktop")).toBeVisible()
        await expect(page.getByTestId("services-button")).toBeVisible()
        await expect(page.locator("body")).toBeVisible()
    })
})
