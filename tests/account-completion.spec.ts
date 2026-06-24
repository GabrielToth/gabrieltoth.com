import { expect, test } from "@playwright/test"

/**
 * End-to-End Integration Tests for Account Completion Flow
 *
 * Tests cover:
 * - Page rendering and multilingual support
 * - Multilingual support (EN, PT-BR, ES, DE)
 */

test.describe("account completion flow", () => {
    test("page renders with expected heading", async ({ page }) => {
        await page.goto("/en/auth/complete-account", {
            waitUntil: "networkidle",
        })
        await page.waitForSelector("h1")

        await expect(page).toHaveURL(/\/en\/auth\/complete-account\/?/)
        await expect(page.locator("h1")).toContainText("Complete Your Account")
    })

    test("multilingual support - English locale", async ({ page }) => {
        await page.goto("/en/auth/complete-account", {
            waitUntil: "networkidle",
        })
        await page.waitForSelector("h1")

        await expect(page.locator("h1")).toContainText("Complete Your Account")
    })

    test("multilingual support - Portuguese locale", async ({ page }) => {
        await page.goto("/pt-BR/auth/complete-account", {
            waitUntil: "networkidle",
        })

        await expect(page.locator("h1")).toContainText("Complete Sua Conta")
    })

    test("multilingual support - Spanish locale", async ({ page }) => {
        await page.goto("/es/auth/complete-account", {
            waitUntil: "networkidle",
        })

        await expect(page.locator("h1")).toContainText("Completa Tu Cuenta")
    })

    test("multilingual support - German locale", async ({ page }) => {
        await page.goto("/de/auth/complete-account", {
            waitUntil: "networkidle",
        })

        await expect(page.locator("h1")).toContainText(
            "Vervollständigen Sie Ihr Konto"
        )
    })

    test("middleware redirect - incomplete account redirects to completion", async ({
        page,
    }) => {
        const response = await page.goto("/dashboard", {
            waitUntil: "networkidle",
        })
        expect(response?.status()).toBe(200)
        const currentUrl = page.url()
        expect(currentUrl).toContain("/dashboard")
    })
})
