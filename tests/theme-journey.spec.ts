import { expect, test } from "@playwright/test"

test.describe("theme switching journey", () => {
    test("default theme is dark on page load", async ({ page }) => {
        await page.goto("/en")

        // ThemeProvider defaults to "dark" but does not persist to localStorage on init
        await expect
            .poll(async () =>
                page.evaluate(() =>
                    document.documentElement.classList.contains("dark")
                )
            )
            .toBe(true)

        // Default is NOT persisted to localStorage — only user toggles persist
        await expect
            .poll(async () =>
                page.evaluate(() => window.localStorage.getItem("theme"))
            )
            .toBe(null)
    })

    test("toggle to light mode changes document class and localStorage", async ({
        page,
    }) => {
        await page.goto("/en")

        await page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
            .click()

        await expect
            .poll(async () =>
                page.evaluate(() =>
                    document.documentElement.classList.contains("dark")
                )
            )
            .toBe(false)

        await expect
            .poll(async () =>
                page.evaluate(() => window.localStorage.getItem("theme"))
            )
            .toBe("light")
    })

    test("toggle back to dark mode works", async ({ page }) => {
        await page.goto("/en")

        await page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
            .click()

        await page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
            .click()

        await expect
            .poll(async () =>
                page.evaluate(() =>
                    document.documentElement.classList.contains("dark")
                )
            )
            .toBe(true)
    })

    test("theme persists after page reload", async ({ page }) => {
        await page.goto("/en")

        await page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
            .click()

        await page.reload()

        await expect
            .poll(async () =>
                page.evaluate(() => window.localStorage.getItem("theme"))
            )
            .toBe("light")
    })

    test("theme persists across page navigation", async ({ page }) => {
        await page.goto("/en")

        await page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
            .click()

        await page.goto("/en/minecraft")

        await expect
            .poll(async () =>
                page.evaluate(() => window.localStorage.getItem("theme"))
            )
            .toBe("light")
    })

    test("theme persists after language switch", async ({ page }) => {
        await page.goto("/en")

        await page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
            .click()

        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-de").click()

        await expect
            .poll(async () =>
                page.evaluate(() => window.localStorage.getItem("theme"))
            )
            .toBe("light")
    })

    for (const locale of ["en", "pt-BR", "es", "de"]) {
        test(`theme toggle is visible on ${locale} homepage`, async ({
            page,
        }) => {
            await page.goto(`/${locale}`)

            const toggle = page
                .getByRole("button", { name: /switch to (light|dark) mode/i })
                .first()
            await expect(toggle).toBeVisible()
        })
    }

    test("theme toggle works on channel management page", async ({ page }) => {
        await page.goto("/en/channel-management")

        // Theme toggle is inside the language selector dropdown
        await page.getByTestId("language-selector-button").first().click()
        await page.getByRole("menuitem", { name: /toggle theme/i }).click()

        await expect
            .poll(async () =>
                page.evaluate(() =>
                    document.documentElement.classList.contains("dark")
                )
            )
            .toBe(false)
    })

    test("theme toggle visible on desktop viewport (1280x800)", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1280, height: 800 })
        await page.goto("/en")

        const toggle = page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
        await expect(toggle).toBeVisible()
    })

    test("theme toggle visible on tablet viewport (768x1024)", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 768, height: 1024 })
        await page.goto("/en")

        const toggle = page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
        await expect(toggle).toBeVisible()
    })

    test("theme toggle visible on mobile viewport (375x667)", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 375, height: 667 })
        await page.goto("/en")

        const toggle = page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
        await expect(toggle).toBeVisible()
    })

    test("default theme re-applies after localStorage is cleared", async ({
        page,
    }) => {
        await page.goto("/en")

        await page.evaluate(() => window.localStorage.removeItem("theme"))

        await page.reload()

        // ThemeProvider defaults to "dark" on the class
        await expect
            .poll(async () =>
                page.evaluate(() =>
                    document.documentElement.classList.contains("dark")
                )
            )
            .toBe(true)

        // Default is not persisted to localStorage — only user toggles persist
        await expect
            .poll(async () =>
                page.evaluate(() => window.localStorage.getItem("theme"))
            )
            .toBe(null)
    })

    test("theme persists across multiple locale switches", async ({ page }) => {
        await page.goto("/en")
        let toggleBtn = page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
        await toggleBtn.click()

        // Switch to pt-BR
        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-pt-BR").click()

        // Re-query after navigation to avoid detached DOM elements
        await page.getByTestId("language-selector-button").first().click()
        await page
            .getByTestId("language-selector-option-es")
            .click({ force: true })

        await expect
            .poll(async () =>
                page.evaluate(() => window.localStorage.getItem("theme"))
            )
            .toBe("light")
    })

    test("toggling theme on non-default locale works", async ({ page }) => {
        await page.goto("/de")

        await page
            .getByRole("button", { name: /switch to (light|dark) mode/i })
            .first()
            .click()

        await expect
            .poll(async () =>
                page.evaluate(() =>
                    document.documentElement.classList.contains("dark")
                )
            )
            .toBe(false)

        await expect
            .poll(async () =>
                page.evaluate(() => window.localStorage.getItem("theme"))
            )
            .toBe("light")
    })
})
