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

        test("GET /api/auth/csrf returns a CSRF token for anonymous session", async ({
            request,
        }) => {
            const response = await request.get("/api/auth/csrf")
            expect(response.ok()).toBe(true)
            const body = await response.json()
            expect(body.success).toBe(true)
            expect(body.data).toBeDefined()
            expect(body.data.csrfToken).toBeDefined()
            expect(typeof body.data.csrfToken).toBe("string")
        })

        test("POST /api/auth/logout rejects without CSRF token", async ({
            request,
        }) => {
            const response = await request.post("/api/auth/logout")
            expect(response.status()).toBe(403)
            const body = await response.json()
            expect(body.error).toBeDefined()
        })

        test("POST /api/auth/logout rejects with invalid CSRF token", async ({
            request,
        }) => {
            const response = await request.post("/api/auth/logout", {
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": "invalid-token-123",
                },
            })
            // Session-level CSRF check fails → 403
            expect(response.status()).toBe(403)
            const body = await response.json()
            expect(body.error).toBeDefined()
        })

        for (const locale of ["en", "pt-BR", "es", "de"]) {
            test(`dashboard redirects unauthenticated users away from ${locale} dashboard`, async ({
                page,
            }) => {
                await page.goto(`/${locale}/dashboard`, {
                    waitUntil: "networkidle",
                })
                const currentUrl = page.url()
                expect(currentUrl).toContain(`/${locale}/signin`)
            })
        }
    })

    test.describe("logout API security", () => {
        test("rejects GET requests to /api/auth/logout", async ({
            request,
        }) => {
            const response = await request.get("/api/auth/logout")
            expect(response.status()).toBe(405)
            const body = await response.json()
            expect(body.error).toBeDefined()
        })

        test("rejects PUT requests to /api/auth/logout", async ({
            request,
        }) => {
            const response = await request.put("/api/auth/logout", {})
            expect(response.status()).toBe(405)
        })

        test("rejects DELETE requests to /api/auth/logout", async ({
            request,
        }) => {
            const response = await request.delete("/api/auth/logout")
            expect(response.status()).toBe(405)
        })

        test("rejects PATCH requests to /api/auth/logout", async ({
            request,
        }) => {
            const response = await request.patch("/api/auth/logout", {})
            expect(response.status()).toBe(405)
        })

        test("rejects logout with wrong content type", async ({ request }) => {
            const response = await request.post("/api/auth/logout", {
                headers: {
                    "Content-Type": "text/plain",
                },
            })
            expect(response.status()).toBe(403)
        })
    })
})
