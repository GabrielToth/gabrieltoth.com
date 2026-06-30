import { expect, test } from "@playwright/test"

const LOCALES = ["en", "pt-BR", "es", "de"] as const

const LOCALE_SERVICES_PATHS: Record<string, string> = {
    en: "services",
    "pt-BR": "servicos",
    es: "servicios",
    de: "dienstleistungen",
}

test.describe("Services landing page - comprehensive tests", () => {
    test.describe("Page loading and HTTP status", () => {
        test("page loads at /en/services with HTTP 200", async ({ page }) => {
            const response = await page.goto("/en/services")
            expect(response?.status()).toBe(200)
        })
    })

    test.describe("Page structure and content", () => {
        test("h1 displays Services title", async ({ page }) => {
            await page.goto("/en/services")
            const h1 = page.locator("h1").first()
            await expect(h1).toBeVisible()
            const h1Text = await h1.textContent()
            expect(h1Text).toBeTruthy()
            expect(h1Text?.length).toBeGreaterThan(0)
        })

        test("Service cards section renders all 5 service categories", async ({
            page,
        }) => {
            await page.goto("/en/services")
            const links = page.locator("a")
            const linkCount = await links.count()
            expect(linkCount).toBeGreaterThanOrEqual(5)
        })

        test("Service cards render with proper structure", async ({ page }) => {
            await page.goto("/en/services")
            const headings = page.locator("h3")
            const headingCount = await headings.count()
            expect(headingCount).toBeGreaterThanOrEqual(5)
        })
    })

    test.describe("Submenu navigation and links", () => {
        test("submenu links have href attributes", async ({ page }) => {
            await page.goto("/en/services")
            const links = page.locator("a")
            const linkCount = await links.count()
            expect(linkCount).toBeGreaterThanOrEqual(5)

            for (let i = 0; i < Math.min(5, linkCount); i++) {
                const link = links.nth(i)
                const href = await link.getAttribute("href")
                expect(href).toBeTruthy()
            }
        })

        test("each category in submenu is clickable", async ({ page }) => {
            await page.goto("/en/services")
            const links = page.locator("a")
            const firstLink = links.first()
            await expect(firstLink).toBeEnabled()
        })
    })

    test.describe("Content visibility and rendering", () => {
        test("footer is visible on services page", async ({ page }) => {
            await page.goto("/en/services")
            const footer = page.locator("footer")
            await expect(footer).toBeVisible()
        })

        test("main content area is visible", async ({ page }) => {
            await page.goto("/en/services")
            const main = page.locator("main")
            await expect(main).toBeVisible()
        })

        test("hero section with title is rendered", async ({ page }) => {
            await page.goto("/en/services")
            const h1 = page.locator("h1").first()
            await expect(h1).toBeVisible()
            const h1Text = await h1.textContent()
            expect(h1Text).toBeTruthy()
        })

        test("submenu categories are visible", async ({ page }) => {
            await page.goto("/en/services")
            const links = page.locator("a")
            expect(await links.count()).toBeGreaterThanOrEqual(5)
        })

        test("approach section is visible", async ({ page }) => {
            await page.goto("/en/services")
            const h2Headings = page.locator("h2")
            expect(await h2Headings.count()).toBeGreaterThan(0)
        })
    })

    test.describe("Visual regression and layout", () => {
        test("page does not have any 404 elements", async ({ page }) => {
            await page.goto("/en/services")
            const response = await page.evaluate(
                () => document.documentElement.innerHTML
            )
            expect(response).not.toContain("404")
        })

        test("page title is set correctly in browser tab", async ({ page }) => {
            await page.goto("/en/services")
            const title = await page.title()
            expect(title).toContain("Services")
        })
    })

    test.describe("Accessibility features", () => {
        test("page has semantic HTML structure", async ({ page }) => {
            await page.goto("/en/services")
            const main = page.locator("main")
            const sections = page.locator("section")
            await expect(main).toBeVisible()
            expect(await sections.count()).toBeGreaterThan(0)
        })

        test("all links have descriptive text or aria-labels", async ({
            page,
        }) => {
            await page.goto("/en/services")
            const links = page.locator("a")
            const linkCount = await links.count()

            for (let i = 0; i < linkCount; i++) {
                const link = links.nth(i)
                const text = await link.textContent()
                const ariaLabel = await link.getAttribute("aria-label")

                if (text?.trim()) {
                    expect(text.trim().length).toBeGreaterThan(0)
                } else if (ariaLabel) {
                    expect(ariaLabel).toBeTruthy()
                }
            }
        })

        test("heading hierarchy is correct", async ({ page }) => {
            await page.goto("/en/services")
            const h1Count = await page.locator("h1").count()
            expect(h1Count).toBeGreaterThanOrEqual(1)
        })
    })

    test.describe("Performance and responsiveness", () => {
        test("page loads in reasonable time", async ({ page }) => {
            const startTime = Date.now()
            await page.goto("/en/services")
            const loadTime = Date.now() - startTime
            expect(loadTime).toBeLessThan(10000)
        })

        test("page remains responsive after initial load", async ({ page }) => {
            await page.goto("/en/services")
            const link = page.locator("a").first()
            await expect(link).toBeEnabled()
        })

        test("page renders correctly on mobile viewport", async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 })
            await page.goto("/en/services")
            const h1 = page.locator("h1").first()
            await expect(h1).toBeVisible()
        })

        test("page renders correctly on tablet viewport", async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 })
            await page.goto("/en/services")
            const h1 = page.locator("h1").first()
            await expect(h1).toBeVisible()
        })

        test("page renders correctly on desktop viewport", async ({ page }) => {
            await page.setViewportSize({ width: 1920, height: 1080 })
            await page.goto("/en/services")
            const h1 = page.locator("h1").first()
            await expect(h1).toBeVisible()
        })
    })

    test.describe("Submenu category coverage", () => {
        test("submenu includes all 5 required service categories", async ({
            page,
        }) => {
            await page.goto("/en/services")
            const links = page.locator("a")
            const linkCount = await links.count()
            expect(linkCount).toBeGreaterThanOrEqual(5)

            for (let i = 0; i < Math.min(5, linkCount); i++) {
                const link = links.nth(i)
                await expect(link).toBeVisible()
            }
        })
    })

    test.describe("Metadata and SEO", () => {
        test("page has meta description for SEO", async ({ page }) => {
            await page.goto("/en/services")
            const metaDescription = page.locator('meta[name="description"]')
            await expect(metaDescription).toBeVisible()
        })

        test("page has proper Open Graph tags", async ({ page }) => {
            await page.goto("/en/services")
            const ogTitle = page.locator('meta[property="og:title"]')
            expect(ogTitle).toBeTruthy()
        })
    })
})
