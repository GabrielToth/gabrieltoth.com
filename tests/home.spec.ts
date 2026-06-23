import { expect, test } from "@playwright/test"

// Single E2E test focused on the Home page behavior across dynamic locales
// - Uses stable data-testid attributes
// - Validates navigation, header elements, services dropdown, and language switch

test.describe("home page", () => {
    test("loads, navigates services, and switches language", async ({
        page,
    }) => {
        // Start in English locale to avoid redirect races
        await page.goto("/en", { waitUntil: "networkidle" })

        // Ensure we are on /en or /en/
        await expect(page).toHaveURL(/\/en(\/)?$/)

        // Header basic links
        await expect(page.getByTestId("nav-home")).toBeVisible()
        await expect(page.getByTestId("nav-home-desktop")).toBeVisible()
        await expect(page.getByTestId("services-button")).toBeVisible()

        // Open services dropdown and click channel-management link
        await page.getByTestId("services-button").click()
        const servicesLink = page.getByTestId(
            "services-link-channel-management"
        )
        await expect(servicesLink).toBeVisible()
        await servicesLink.click()
        await expect(page).toHaveURL(/\/en\/channel-management\/?/)

        // Go back to Home localized root
        await page.goto("/en", { waitUntil: "networkidle" })
        await expect(page).toHaveURL(/\/en(\/)?$/)
        await expect(page.getByTestId("nav-home-desktop")).toBeVisible()

        // Language switch: switch to pt-BR and ensure URL and persistence
        const langButton = page.getByTestId("language-selector-button").first()
        await langButton.click()
        const ptOption = page.getByTestId("language-selector-option-pt-BR")
        await expect(ptOption).toBeVisible()
        await ptOption.click()
        await expect(page).toHaveURL(/\/pt-BR(?:\/)?$/)

        // Reload to confirm persistence
        await page.reload({ waitUntil: "networkidle" })
        await expect(page).toHaveURL(/\/pt-BR(?:\/)?$/)

        // Smoke: navigate back to home via logo link
        await page.getByTestId("nav-home").click()
        await expect(page.locator("body")).toBeVisible()
    })
})
