import { expect, test } from "@playwright/test"

const LOCALES = ["en", "pt-BR", "es", "de"] as const

const LOCALE_SERVICES_PATHS: Record<string, string> = {
    en: "services",
    "pt-BR": "servicos",
    es: "servicios",
    de: "dienstleistungen",
}

test.describe("Services landing page", () => {
    for (const locale of LOCALES) {
        test(`/${locale}/${LOCALE_SERVICES_PATHS[locale]} loads with HTTP 200`, async ({
            page,
        }) => {
            const response = await page.goto(
                `/${locale}/${LOCALE_SERVICES_PATHS[locale]}`
            )
            expect(response?.status()).toBe(200)
        })

        test(`/${locale}/${LOCALE_SERVICES_PATHS[locale]} has visible h1 title`, async ({
            page,
        }) => {
            await page.goto(`/${locale}/${LOCALE_SERVICES_PATHS[locale]}`)
            await expect(page.locator("h1")).toBeVisible()
        })

        test(`/${locale}/${LOCALE_SERVICES_PATHS[locale]} renders service card links`, async ({
            page,
        }) => {
            await page.goto(`/${locale}/${LOCALE_SERVICES_PATHS[locale]}`)
            // The page has submenu links + service card links
            const links = page.locator("a")
            const count = await links.count()
            expect(count).toBeGreaterThanOrEqual(5)
        })

        test(`/${locale}/${LOCALE_SERVICES_PATHS[locale]} has ServicesSubmenu with h3 headings`, async ({
            page,
        }) => {
            await page.goto(`/${locale}/${LOCALE_SERVICES_PATHS[locale]}`)
            // 5 submenu categories + 3 approach items = 8 h3 elements
            const h3Count = await page.locator("h3").count()
            expect(h3Count).toBe(8)
        })
    }

    test("locale-specific path /pt-BR/servicos resolves", async ({ page }) => {
        const response = await page.goto("/pt-BR/servicos")
        expect(response?.status()).toBe(200)
    })

    test("locale-specific path /es/servicios resolves", async ({ page }) => {
        const response = await page.goto("/es/servicios")
        expect(response?.status()).toBe(200)
    })

    test("locale-specific path /de/dienstleistungen resolves", async ({
        page,
    }) => {
        const response = await page.goto("/de/dienstleistungen")
        expect(response?.status()).toBe(200)
    })
})
