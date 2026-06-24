import { expect, test } from "@playwright/test"

test.describe("dashboard flows", () => {
    test("dashboard root redirects through locale prefix to sign-in", async ({
        page,
    }) => {
        await page.goto("/dashboard", { waitUntil: "networkidle" })
        // Without auth, the chain is:
        //   /dashboard --308--> /{locale}/dashboard --302--> /{locale}/login --redirect--> /{locale}/signin
        const currentUrl = page.url()
        expect(currentUrl).toMatch(/\/(en|pt-BR|es|de)\/signin/)
    })

    test("dashboard root 308 redirects to locale-prefixed URL", async ({
        page,
    }) => {
        const response = await page.request.get("/dashboard", {
            maxRedirects: 0,
        })
        expect(response.status()).toBe(308)
        expect(response.headers()["location"]).toMatch(
            /\/(en|pt-BR|es|de)\/dashboard/
        )
    })

    test("dashboard redirect preserves query params through locale prefix", async ({
        page,
    }) => {
        const response = await page.request.get("/dashboard?youtube=success", {
            maxRedirects: 0,
        })
        expect(response.status()).toBe(308)
        const location = response.headers()["location"]
        expect(location).toContain("youtube=success")
    })

    test("locale-prefixed dashboard redirects to sign-in without auth", async ({
        page,
    }) => {
        await page.goto("/en/dashboard", { waitUntil: "networkidle" })
        const currentUrl = page.url()
        expect(currentUrl).toContain("/en/signin")
    })

    test.describe("sub-page redirects", () => {
        const routes = [
            "/dashboard/publish",
            "/dashboard/insights",
            "/dashboard/settings",
            "/dashboard/credits",
        ] as const

        for (const route of routes) {
            test(`${route} redirects through locale prefix to sign-in without auth`, async ({
                page,
            }) => {
                const response = await page.request.get(route, {
                    maxRedirects: 0,
                })
                expect(response.status()).toBe(308)
                expect(response.headers()["location"]).toMatch(
                    /\/(en|pt-BR|es|de)\/dashboard/
                )
            })

            test(`${route} eventually reaches sign-in page without auth`, async ({
                page,
            }) => {
                await page.goto(route, { waitUntil: "networkidle" })
                const currentUrl = page.url()
                expect(currentUrl).toMatch(/\/(en|pt-BR|es|de)\/signin/)
            })
        }
    })

    test.describe("auth-related", () => {
        test("auth login page is accessible at locale-prefixed /en/login", async ({
            page,
        }) => {
            const response = await page.goto("/en/login")
            // /en/login redirects to /en/signin
            await expect(page).toHaveURL(/\/en\/signin/)
            await expect(page.locator("body")).toBeVisible()
        })

        test("login page shows auth form elements", async ({ page }) => {
            await page.goto("/en/login")
            // /en/login redirects to /en/signin; inputs are behind button clicks
            // Click "Sign in with Email" to reveal the email input
            await page.getByText("Sign in with Email").click()
            const emailInputs = await page
                .locator('input[type="email"]')
                .count()
            expect(emailInputs).toBeGreaterThan(0)
        })
    })
})
