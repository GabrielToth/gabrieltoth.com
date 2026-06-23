import { expect, test } from "@playwright/test"

test.describe("dashboard flows", () => {
    test("dashboard root redirects to publish page", async ({ page }) => {
        await page.goto("/dashboard")
        await expect(page).toHaveURL(/\/dashboard\/publish/)
    })

    test("dashboard root redirect preserves query params", async ({ page }) => {
        await page.goto("/dashboard?youtube=success")
        await expect(page).toHaveURL(/\/dashboard\/publish\?youtube=success/)
    })

    test("dashboard publish page loads with expected content", async ({
        page,
    }) => {
        await page.goto("/dashboard/publish")

        await expect(
            page.getByRole("heading", { name: "Publish" })
        ).toBeVisible()
        await expect(
            page.getByText(
                "Manage your scheduled and published posts across all social channels."
            )
        ).toBeVisible()
        await expect(
            page.getByText("Publish content management coming soon...")
        ).toBeVisible()
    })

    test("dashboard insights page loads with expected content", async ({
        page,
    }) => {
        await page.goto("/dashboard/insights")

        await expect(
            page.getByRole("heading", { name: "Insights" })
        ).toBeVisible()
        await expect(
            page.getByText(
                "View comprehensive analytics and performance metrics for your social media presence."
            )
        ).toBeVisible()
        await expect(
            page.getByText("Analytics dashboard coming soon...")
        ).toBeVisible()
    })

    test("dashboard settings page loads", async ({ page }) => {
        await page.goto("/dashboard/settings")

        // Settings page uses dynamic import with SettingsContainer
        // It should render without crashing
        await expect(page.locator("body")).toBeVisible()
    })

    test("dashboard credits page loads with credit widget", async ({
        page,
    }) => {
        await page.goto("/dashboard/credits")

        await expect(
            page.getByRole("heading", { name: /Credits/i })
        ).toBeVisible()
        await expect(
            page.getByText("Manage your credit balance and view costs")
        ).toBeVisible()
    })

    test.describe("sidebar navigation", () => {
        test("sidebar publish nav button is visible", async ({ page }) => {
            await page.goto("/dashboard/publish")

            const publishBtn = page
                .getByRole("button", { name: /Publish/ })
                .first()
            await expect(publishBtn).toBeVisible()
        })

        test("sidebar insights nav button is visible", async ({ page }) => {
            await page.goto("/dashboard/insights")

            const insightsBtn = page
                .getByRole("button", { name: /Insights/ })
                .first()
            await expect(insightsBtn).toBeVisible()
        })

        test("sidebar settings nav button is visible", async ({ page }) => {
            await page.goto("/dashboard/settings")

            const settingsBtn = page
                .getByRole("button", { name: /Settings/ })
                .first()
            await expect(settingsBtn).toBeVisible()
        })

        test("sidebar logout button is visible", async ({ page }) => {
            await page.goto("/dashboard/publish")

            const logoutBtn = page
                .getByRole("button", { name: /Logout/ })
                .first()
            await expect(logoutBtn).toBeVisible()
        })

        test("sidebar shows connect channels section", async ({ page }) => {
            await page.goto("/dashboard/publish")

            await expect(page.getByText("Connect Channels")).toBeVisible()
        })

        test("clicking sidebar insights navigates to /dashboard/insights", async ({
            page,
        }) => {
            await page.goto("/dashboard/publish")

            await page
                .getByRole("button", { name: /Insights/ })
                .first()
                .click()
            await expect(page).toHaveURL(/\/dashboard\/insights/)
        })

        test("clicking sidebar settings navigates to /dashboard/settings", async ({
            page,
        }) => {
            await page.goto("/dashboard/publish")

            await page
                .getByRole("button", { name: /Settings/ })
                .first()
                .click()
            await expect(page).toHaveURL(/\/dashboard\/settings/)
        })
    })

    test.describe("route responses", () => {
        const routes = [
            "/dashboard",
            "/dashboard/publish",
            "/dashboard/insights",
            "/dashboard/settings",
            "/dashboard/credits",
        ] as const

        for (const route of routes) {
            test(`dashboard route ${route} responds successfully`, async ({
                page,
            }) => {
                const response = await page.goto(route, {
                    waitUntil: "networkidle",
                })
                expect(response?.status()).toBe(200)
            })
        }

        test("all dashboard routes return 200 sequentially", async ({
            page,
        }) => {
            for (const route of routes) {
                const response = await page.goto(route, {
                    waitUntil: "networkidle",
                })
                expect(
                    response?.status(),
                    `Expected ${route} to return 200`
                ).toBe(200)
            }
        })
    })

    test.describe("auth-related", () => {
        test("auth login page is accessible at locale-prefixed /en/login", async ({
            page,
        }) => {
            const response = await page.goto("/en/login")
            expect(response?.status()).toBe(200)
            await expect(page.locator("body")).toBeVisible()
        })

        test("login page shows auth form elements", async ({ page }) => {
            await page.goto("/en/login")
            const emailInputs = await page
                .locator('input[type="email"]')
                .count()
            const passwordInputs = await page
                .locator('input[type="password"]')
                .count()
            expect(emailInputs + passwordInputs).toBeGreaterThan(0)
        })
    })
})
