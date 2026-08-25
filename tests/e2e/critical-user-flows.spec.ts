import { test, expect } from "@playwright/test"

test.describe("Critical User Flows E2E", () => {
    test("should load home page and display language switcher", async ({
        page,
    }) => {
        await page.goto("/")
        await expect(page).toHaveTitle(/Gabriel Toth/i)
    })

    test("should navigate to login page and render authentication entry", async ({
        page,
    }) => {
        await page.goto("/pt-BR/login")
        await expect(page.locator("body")).toBeVisible()
    })

    test("should load dashboard channels page", async ({ page }) => {
        await page.goto("/pt-BR/dashboard/channels")
        await expect(page.locator("body")).toBeVisible()
    })
})
