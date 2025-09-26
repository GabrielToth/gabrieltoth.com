import { expect, test } from "@playwright/test"

test.describe("home page - theme", () => {
    test("theme toggle updates html class and persists after reload", async ({
        page,
    }) => {
        await page.goto("/en")

        // Initial state should be dark (from RootLayout + ThemeProvider)
        await expect
            .poll(async () => {
                return await page.evaluate(() =>
                    document.documentElement.classList.contains("dark")
                )
            })
            .toBe(true)

        const toggleBtn = page
            .getByRole("button", { name: /switch to light mode/i })
            .first()

        // Toggle to light
        await toggleBtn.click()

        await expect
            .poll(async () => {
                return await page.evaluate(() =>
                    document.documentElement.classList.contains("light")
                )
            })
            .toBe(true)

        await expect
            .poll(async () => {
                return await page.evaluate(() => localStorage.getItem("theme"))
            })
            .toBe("light")

        // Reload and verify persistence
        await page.reload()

        await expect
            .poll(async () => {
                return await page.evaluate(() =>
                    document.documentElement.classList.contains("light")
                )
            })
            .toBe(true)

        await expect
            .poll(async () => {
                return await page.evaluate(() => localStorage.getItem("theme"))
            })
            .toBe("light")
    })
})
