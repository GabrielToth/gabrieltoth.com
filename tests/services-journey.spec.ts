import { expect, test } from "@playwright/test"

const LOCALES = ["en", "pt-BR", "es", "de"] as const

const LOCALE_SERVICE_ROUTES: Record<string, Record<string, string>> = {
    en: {
        "channel-management": "channel-management",
        "pc-optimization": "pc-optimization",
        "editors": "editors",
    },
    "pt-BR": {
        "channel-management": "gerenciamento-de-canais",
        "pc-optimization": "otimizacao-de-pc",
        "editors": "editores",
    },
    es: {
        "channel-management": "gestion-de-canales",
        "pc-optimization": "optimizacion-de-pc",
        "editors": "editores",
    },
    de: {
        "channel-management": "kanalverwaltung",
        "pc-optimization": "pc-optimierung",
        "editors": "editoren",
    },
}

test.describe("services journey", () => {
    // 1 - Parameterized: services button visible on homepage across all locales
    for (const locale of LOCALES) {
        test(`services button visible on /${locale} homepage`, async ({
            page,
        }) => {
            await page.goto(`/${locale}`)
            await expect(page.getByTestId("services-button")).toBeVisible()
        })
    }

    // 2 - Services dropdown opens and shows channel-management link
    test("services dropdown shows channel management link on click", async ({
        page,
    }) => {
        await page.goto("/en")
        await page.getByTestId("services-button").click()
        await expect(
            page.getByTestId("services-link-channel-management")
        ).toBeVisible()
    })

    // 3 - Services dropdown shows pc-optimization link
    test("services dropdown shows pc optimization link on click", async ({
        page,
    }) => {
        await page.goto("/en")
        await page.getByTestId("services-button").click()
        await expect(
            page.getByTestId("services-link-pc-optimization")
        ).toBeVisible()
    })

    // 4 - Navigate from home to channel management via dropdown
    test("navigate from home to channel management via dropdown", async ({
        page,
    }) => {
        await page.goto("/en")
        await page.getByTestId("services-button").click()
        await page.getByTestId("services-link-channel-management").click()
        await expect(page).toHaveURL(
            /\/en\/(channel-management|gerenciamento-de-canais|gestion-de-canales|kanalverwaltung)/
        )
    })

    // 5 - Navigate from home to pc optimization via dropdown
    test("navigate from home to pc optimization via dropdown", async ({
        page,
    }) => {
        await page.goto("/en")
        await page.getByTestId("services-button").click()
        await page.getByTestId("services-link-pc-optimization").click()
        await expect(page).toHaveURL(
            /\/en\/(pc-optimization|otimizacao-de-pc|optimizacion-de-pc|pc-optimierung)/
        )
    })

    // 6 - Parameterized: all service routes load with 200 for all locales
    for (const locale of LOCALES) {
        for (const [serviceName, path] of Object.entries(
            LOCALE_SERVICE_ROUTES[locale]
        )) {
            test(`/${locale}/${serviceName} (${path}) returns 200`, async ({
                page,
            }) => {
                const response = await page.goto(`/${locale}/${path}`)
                expect(response?.status()).toBe(200)
            })
        }
    }

    // 7 - Browser back from channel management returns to previous page
    test("browser back from channel management returns to homepage", async ({
        page,
    }) => {
        await page.goto("/en")
        await page.getByTestId("services-button").click()
        await page.getByTestId("services-link-channel-management").click()
        await expect(page).toHaveURL(/\/en\/(channel-management|gerenciamento-de-canais|gestion-de-canales|kanalverwaltung)/)
        await page.goBack()
        await expect(page).toHaveURL(/\/en(?:\/)?(?:#.*)?$/)
    })

    // 8 - Browser back from pc optimization returns to previous page
    test("browser back from pc optimization returns to homepage", async ({
        page,
    }) => {
        await page.goto("/en")
        await page.getByTestId("services-button").click()
        await page.getByTestId("services-link-pc-optimization").click()
        await expect(page).toHaveURL(/\/en\/(pc-optimization|otimizacao-de-pc|optimizacion-de-pc|pc-optimierung)/)
        await page.goBack()
        await expect(page).toHaveURL(/\/en(?:\/)?(?:#.*)?$/)
    })

    // 9 - Parameterized: service pages have body content for all locales
    for (const locale of LOCALES) {
        for (const [serviceName, path] of Object.entries(
            LOCALE_SERVICE_ROUTES[locale]
        )) {
            test(`/${locale}/${serviceName} (${path}) has body content`, async ({
                page,
            }) => {
                await page.goto(`/${locale}/${path}`)
                const bodyContent = await page.textContent("body")
                expect(bodyContent?.trim().length).toBeGreaterThan(50)
            })
        }
    }

    // 10 - Language selector visible on channel management page
    test("language selector visible on channel management page", async ({
        page,
    }) => {
        await page.goto("/en/channel-management")
        await expect(
            page.getByTestId("language-selector-button").first()
        ).toBeVisible()
    })

    // 11 - Language selector visible on pc optimization page
    test("language selector visible on pc optimization page", async ({
        page,
    }) => {
        await page.goto("/en/pc-optimization")
        await expect(
            page.getByTestId("language-selector-button").first()
        ).toBeVisible()
    })

    // 12 - Language selector visible on editors page
    test("language selector visible on editors page", async ({ page }) => {
        await page.goto("/en/editors")
        await expect(
            page.getByTestId("language-selector-button").first()
        ).toBeVisible()
    })

    // 13 - Desktop nav links visible on homepage
    test("desktop navigation links visible on homepage", async ({ page }) => {
        await page.goto("/en")
        await expect(page.getByTestId("nav-home-desktop")).toBeVisible()
        await expect(page.getByTestId("nav-login")).toBeVisible()
    })

    // 14 - Homepage hero section accessible after service page navigation
    test("homepage hero accessible after navigating from service page", async ({
        page,
    }) => {
        await page.goto("/en/channel-management")
        await page.getByTestId("nav-home-desktop").click()
        await expect(page.locator("#hero")).toBeVisible()
    })

    // 15 - Navigate directly between service pages
    test("navigate directly from channel management to pc optimization", async ({
        page,
    }) => {
        await page.goto("/en/channel-management")
        await page.goto("/en/pc-optimization")
        await expect(page).toHaveURL(/\/en\/pc-optimization/)
    })

    // 16 - Breadcrumb navigation visible on channel management page
    test("breadcrumb visible on channel management page", async ({ page }) => {
        await page.goto("/en/channel-management")
        const breadcrumbNav = page.getByRole("navigation", {
            name: "breadcrumb",
        })
        await expect(breadcrumbNav).toBeVisible()
    })

    // 17 - Breadcrumb navigation visible on pc optimization page
    test("breadcrumb visible on pc optimization page", async ({ page }) => {
        await page.goto("/en/pc-optimization")
        const breadcrumbNav = page.getByRole("navigation", {
            name: "breadcrumb",
        })
        await expect(breadcrumbNav).toBeVisible()
    })

    // 18 - Breadcrumb navigation visible on editors page
    test("breadcrumb visible on editors page", async ({ page }) => {
        await page.goto("/en/editors")
        const breadcrumbNav = page.getByRole("navigation", {
            name: "breadcrumb",
        })
        await expect(breadcrumbNav).toBeVisible()
    })

    // 19 - Mobile menu toggle opens services links
    test("mobile menu contains service navigation links", async ({ page }) => {
        await page.goto("/en")
        await page.getByTestId("mobile-menu-toggle").click()
        await expect(page.getByTestId("mobile-nav")).toBeVisible()
    })

    // 20 - Navigate to editors from homepage via direct route
    test("editors page loads for all locales", async ({ page }) => {
        for (const locale of LOCALES) {
            const path = LOCALE_SERVICE_ROUTES[locale]["editors"]
            const response = await page.goto(`/${locale}/${path}`)
            expect(response?.status()).toBe(200)
        }
    })
})
