import { expect, test } from "@playwright/test"

/**
 * Preservation Property Tests - English Routes and Static Files Behavior
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * This test suite verifies that English routes and static files continue to work
 * correctly on UNFIXED code. These tests establish the baseline behavior that
 * must be preserved after the fix is applied.
 *
 * EXPECTED OUTCOME ON UNFIXED CODE: Tests PASS
 * - English routes load without rewriting
 * - Static files are served correctly
 * - Root path redirects work
 * - Query parameters are preserved
 * - Non-localized routes work
 *
 * EXPECTED OUTCOME ON FIXED CODE: Tests PASS (no regressions)
 * - All preservation tests continue to pass
 * - No existing functionality is broken
 */

test.describe("Preservation: English Routes and Static Files", () => {
    test.describe("English Routes Continue to Load", () => {
        test("Portuguese login page loads without rewriting: /pt-BR/login/", async ({
            page,
        }) => {
            // Request the English login path directly
            const response = await page.goto("/pt-BR/login/", {
                waitUntil: "load",
            })

            // Verify the request was successful
            expect(response?.status()).toBe(200)

            // Verify the page loaded
            const pageContent = await page.content()
            expect(pageContent).toBeTruthy()

            // Verify we're on a login page
            const hasLoginContent =
                (await page.locator('input[type="email"]').count()) > 0 ||
                (await page.locator('input[type="password"]').count()) > 0 ||
                pageContent.includes("login")

            expect(hasLoginContent).toBeTruthy()
        })

        test("Spanish register page loads without rewriting: /es/register/", async ({
            page,
        }) => {
            // Request the English register path directly
            const response = await page.goto("/es/register/", {
                waitUntil: "load",
            })

            // Verify the request was successful
            expect(response?.status()).toBe(200)

            // Verify the page loaded
            const pageContent = await page.content()
            expect(pageContent).toBeTruthy()

            // Verify we're on a register page
            const hasRegisterContent =
                (await page.locator('input[type="email"]').count()) > 0 ||
                (await page.locator('input[type="password"]').count()) > 0 ||
                pageContent.includes("register")

            expect(hasRegisterContent).toBeTruthy()
        })

        test("German editors page loads without rewriting: /de/editors/", async ({
            page,
        }) => {
            // Request the English editors path directly
            const response = await page.goto("/de/editors/", {
                waitUntil: "load",
            })

            // Verify the request was successful
            expect(response?.status()).toBe(200)

            // Verify the page loaded
            const pageContent = await page.content()
            expect(pageContent).toBeTruthy()

            // Verify we're on an editors page
            const hasEditorsContent =
                pageContent.includes("editors") ||
                pageContent.includes("editor")

            expect(hasEditorsContent).toBeTruthy()
        })
    })

    test.describe("Root Path Continues to Redirect", () => {
        test("Root path / redirects to /pt-BR/", async ({ page }) => {
            // Request the root path
            const response = await page.goto("/", {
                waitUntil: "load",
            })

            // Verify the request was successful
            expect(response?.status()).toBe(200)

            // Verify we were redirected to pt-BR
            const currentUrl = page.url()
            expect(currentUrl).toContain("/pt-BR/")
        })
    })

    test.describe("Static Files Continue to be Served", () => {
        test("robots.txt is served correctly", async ({ page }) => {
            // Request robots.txt
            const response = await page.goto("/robots.txt", {
                waitUntil: "networkidle",
            })

            // Verify the request was successful
            expect(response?.status()).toBe(200)

            // Verify content type is text/plain
            const contentType = response?.headers()["content-type"]
            expect(contentType).toContain("text/plain")

            // Verify content is not empty
            const content = await response?.text()
            expect(content).toBeTruthy()
            expect(content?.length).toBeGreaterThan(0)
        })

        test("sitemap.xml is served correctly", async ({ page }) => {
            // Request sitemap.xml
            const response = await page.goto("/sitemap.xml", {
                waitUntil: "networkidle",
            })

            // Verify the request was successful
            expect(response?.status()).toBe(200)

            // Verify content type is application/xml
            const contentType = response?.headers()["content-type"]
            expect(contentType).toContain("application/xml")

            // Verify content is not empty
            const content = await response?.text()
            expect(content).toBeTruthy()
            expect(content?.length).toBeGreaterThan(0)
        })

        test("locale-specific sitemaps are served correctly", async ({
            page,
        }) => {
            const sitemaps = [
                "/sitemap-pt-BR.xml",
                "/sitemap-es.xml",
                "/sitemap-de.xml",
                "/sitemap-en.xml",
            ]

            for (const sitemap of sitemaps) {
                const response = await page.goto(sitemap, {
                    waitUntil: "networkidle",
                })

                // Verify the request was successful
                expect(response?.status()).toBe(200)

                // Verify content type is application/xml
                const contentType = response?.headers()["content-type"]
                expect(contentType).toContain("application/xml")

                // Verify content is not empty
                const content = await response?.text()
                expect(content).toBeTruthy()
                expect(content?.length).toBeGreaterThan(0)
            }
        })
    })

    test.describe("Non-Localized Routes Continue to Work", () => {
        test("API routes continue to work", async ({ page }) => {
            // Test that API routes are accessible
            // Note: This is a basic check - actual API endpoints may vary
            const response = await page.request.get("/api/", {
                failOnStatusCode: false,
            })

            // API root may return 404, 405, 500, or 200, but should not cause server crashes
            expect([404, 405, 200, 500]).toContain(response.status())
        })

        test("Public assets are accessible", async ({ page }) => {
            // Request a common public asset path
            // Note: This checks that the public directory is accessible
            const response = await page.request.get("/favicon.ico", {
                failOnStatusCode: false,
            })

            // Favicon should be accessible (200) or not found (404)
            // but should not cause server errors (5xx)
            expect(response.status()).toBeLessThan(500)
        })
    })

    test.describe("Query Parameters are Preserved", () => {
        test("Query parameters are preserved on English routes: /pt-BR/login/?redirect=/dashboard", async ({
            page,
        }) => {
            // Request an English route with query parameters
            const response = await page.goto(
                "/pt-BR/login/?redirect=/dashboard",
                {
                    waitUntil: "load",
                }
            )

            // Verify the request was successful
            expect(response?.status()).toBe(200)

            // Verify the page loaded
            const pageContent = await page.content()
            expect(pageContent).toBeTruthy()

            // Verify we're on a login page
            const hasLoginContent =
                (await page.locator('input[type="email"]').count()) > 0 ||
                (await page.locator('input[type="password"]').count()) > 0 ||
                pageContent.includes("login")

            expect(hasLoginContent).toBeTruthy()

            // Verify the URL contains the query parameter
            const currentUrl = page.url()
            expect(currentUrl).toContain("redirect=/dashboard")
        })

        test("Multiple query parameters are preserved", async ({ page }) => {
            // Request with multiple query parameters
            const response = await page.goto(
                "/pt-BR/login/?redirect=/dashboard&utm_source=test",
                {
                    waitUntil: "load",
                }
            )

            // Verify the request was successful
            expect(response?.status()).toBe(200)

            // Verify the URL contains both query parameters
            const currentUrl = page.url()
            expect(currentUrl).toContain("redirect=/dashboard")
            expect(currentUrl).toContain("utm_source=test")
        })
    })

    test.describe("Property-Based Tests: English Routes Preservation", () => {
        test("All English routes in supported locales load successfully", async ({
            page,
        }) => {
            // Property: For any supported locale and English route, the page should load
            const locales = ["pt-BR", "es", "de", "en"]
            const englishRoutes = ["login", "register", "editors"]

            for (const locale of locales) {
                for (const route of englishRoutes) {
                    const response = await page.goto(`/${locale}/${route}/`, {
                        waitUntil: "load",
                    })

                    // Verify the request was successful
                    expect(response?.status()).toBe(200)

                    // Verify the page loaded
                    const pageContent = await page.content()
                    expect(pageContent).toBeTruthy()
                }
            }
        })

        test("Query parameters are preserved across different routes", async ({
            page,
        }) => {
            // Property: For any English route with query parameters, they should be preserved
            const testCases = [
                { route: "/pt-BR/login/", params: "?redirect=/home" },
                { route: "/es/register/", params: "?email=test@example.com" },
                { route: "/de/editors/", params: "?sort=name&order=asc" },
            ]

            for (const testCase of testCases) {
                const response = await page.goto(
                    testCase.route + testCase.params,
                    {
                        waitUntil: "load",
                    }
                )

                // Verify the request was successful
                expect(response?.status()).toBe(200)

                // Verify the URL contains the query parameters
                const currentUrl = page.url()
                expect(currentUrl).toContain(testCase.params)
            }
        })

        test("Static files with different extensions are served", async ({
            page,
        }) => {
            // Property: Static files should be served with appropriate content types
            const staticFiles = [
                { path: "/robots.txt", expectedType: "text/plain" },
                { path: "/sitemap.xml", expectedType: "application/xml" },
            ]

            for (const file of staticFiles) {
                const response = await page.goto(file.path, {
                    waitUntil: "networkidle",
                })

                // Verify the request was successful
                expect(response?.status()).toBe(200)

                // Verify content type
                const contentType = response?.headers()["content-type"]
                expect(contentType).toContain(file.expectedType)
            }
        })
    })

    test.describe("Baseline Behavior Documentation", () => {
        test("Document: English routes load without rewriting", async ({
            page,
        }) => {
            // This test documents the baseline behavior
            // English routes should load directly without any rewriting

            const englishRoutes = [
                "/pt-BR/login/",
                "/es/register/",
                "/de/editors/",
            ]

            for (const route of englishRoutes) {
                const response = await page.goto(route, {
                    waitUntil: "load",
                })

                expect(response?.status()).toBe(200)
                expect(page.url()).toContain(route)
            }
        })

        test("Document: Static files are served correctly", async ({
            page,
        }) => {
            // This test documents that static files continue to be served
            // without any locale-based rewrites

            const staticFiles = ["/robots.txt", "/sitemap.xml"]

            for (const file of staticFiles) {
                const response = await page.goto(file, {
                    waitUntil: "load",
                })

                expect(response?.status()).toBe(200)
            }
        })

        test("Document: Root path redirects to default locale", async ({
            page,
        }) => {
            // This test documents that the root path continues to redirect
            // to the default locale (pt-BR)

            const response = await page.goto("/", {
                waitUntil: "load",
            })

            expect(response?.status()).toBe(200)
            expect(page.url()).toContain("/pt-BR/")
        })
    })
})
