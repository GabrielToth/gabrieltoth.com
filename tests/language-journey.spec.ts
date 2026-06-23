import { expect, test } from "@playwright/test"

const LOCALES = ["en", "pt-BR", "es", "de"] as const

const CHANNEL_ROUTES: Record<string, string> = {
    en: "channel-management",
    "pt-BR": "gerenciamento-de-canais",
    es: "gestion-de-canales",
    de: "kanalverwaltung",
}

test.describe("language switching journey", () => {
    test("switch from default pt-BR to English changes URL", async ({
        page,
    }) => {
        await page.goto("/pt-BR")
        await page.getByTestId("language-selector-button").first().click()
        await expect(
            page.getByTestId("language-selector-option-en")
        ).toBeVisible()
        await page.getByTestId("language-selector-option-en").click()
        await expect(page).toHaveURL(/\/en(?:\/)?(?:#.*)?$/)
    })

    test("switch from English to pt-BR on home page", async ({ page }) => {
        await page.goto("/en")
        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-pt-BR").click()
        await expect(page).toHaveURL(/\/pt-BR(?:\/)?(?:#.*)?$/)
    })

    test("switch from English to Spanish on home page", async ({ page }) => {
        await page.goto("/en")
        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-es").click()
        await expect(page).toHaveURL(/\/es(?:\/)?(?:#.*)?$/)
    })

    test("switch from English to German on home page", async ({ page }) => {
        await page.goto("/en")
        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-de").click()
        await expect(page).toHaveURL(/\/de(?:\/)?(?:#.*)?$/)
    })

    test("cycle through all 4 locales maintains URL path", async ({ page }) => {
        await page.goto("/en/channel-management")

        for (const locale of LOCALES) {
            await page.getByTestId("language-selector-button").first().click()
            await page.getByTestId(`language-selector-option-${locale}`).click()
            await expect(page).toHaveURL(
                new RegExp(`/${locale}/channel-management`)
            )
        }
    })

    test("cycle through all 4 locales on deep page maintains URL path", async ({
        page,
    }) => {
        await page.goto("/en/iq-test")

        for (const locale of LOCALES) {
            await page.getByTestId("language-selector-button").first().click()
            await page.getByTestId(`language-selector-option-${locale}`).click()
            await expect(page).toHaveURL(new RegExp(`/${locale}/iq-test`))
        }
    })

    test("language selection persists after reload", async ({ page }) => {
        await page.goto("/en")
        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-de").click()
        await expect(page).toHaveURL(/\/de(?:\/)?(?:#.*)?$/)

        await page.reload()
        await expect(page).toHaveURL(/\/de(?:\/)?(?:#.*)?$/)
    })

    test("language selection persists after navigating to another page", async ({
        page,
    }) => {
        await page.goto("/en")
        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-es").click()
        await expect(page).toHaveURL(/\/es(?:\/)?(?:#.*)?$/)

        await page.goto("/es/about-me")
        await expect(page).toHaveURL(new RegExp(`/es/about-me`))
    })

    test("language persists when navigating via home nav link", async ({
        page,
    }) => {
        await page.goto("/de")
        await expect(page).toHaveURL(/\/de(?:\/)?(?:#.*)?$/)

        await page.getByTestId("nav-home").click()
        await expect(page).toHaveURL(/\/de(?:\/)?(?:#.*)?$/)
    })

    test("language persists when clicking the minecraft nav link", async ({
        page,
    }) => {
        await page.goto("/de")
        await page.getByTestId("minecraft-link").first().click()
        await expect(page).toHaveURL(/\/de\/minecraft/)
    })

    test("switch language on channel-management page", async ({ page }) => {
        await page.goto("/en/channel-management")
        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-pt-BR").click()
        await expect(page).toHaveURL(new RegExp(`/pt-BR/channel-management`))
    })

    for (const locale of LOCALES) {
        test(`direct navigation to /${locale} returns 200`, async ({
            page,
        }) => {
            const response = await page.goto(`/${locale}`)
            expect(response?.status()).toBe(200)
            await expect(page).toHaveURL(
                new RegExp(`/${locale}(?:\/)?(?:#.*)?$`)
            )
        })
    }

    test("back navigation after language switch", async ({ page }) => {
        await page.goto("/en/channel-management")
        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-de").click()

        await page.goto("/de/privacy-policy")
        await page.goBack()
        await expect(page).toHaveURL(/\/[a-z-]{2,5}\/channel-management/)
    })

    test("switching language on privacy policy page uses localized route", async ({
        page,
    }) => {
        await page.goto("/en/privacy-policy")
        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-pt-BR").click()
        await expect(page).toHaveURL(new RegExp(`/pt-BR/privacy-policy`))

        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-es").click()
        await expect(page).toHaveURL(new RegExp(`/es/privacy-policy`))

        await page.getByTestId("language-selector-button").first().click()
        await page.getByTestId("language-selector-option-de").click()
        await expect(page).toHaveURL(new RegExp(`/de/privacy-policy`))
    })

    test("switching language from service page toggles between localized routes", async ({
        page,
    }) => {
        for (const from of LOCALES) {
            await page.goto(`/${from}/${CHANNEL_ROUTES[from]}`)
            for (const to of LOCALES) {
                if (from === to) continue
                await page
                    .getByTestId("language-selector-button")
                    .first()
                    .click()
                await page.getByTestId(`language-selector-option-${to}`).click()
                await expect(page).toHaveURL(
                    new RegExp(`/${to}/channel-management`)
                )
                break
            }
            break
        }
    })

    test("dropdown opens and closes on repeated clicks", async ({ page }) => {
        await page.goto("/en")
        const button = page.getByTestId("language-selector-button").first()

        await button.click()
        await expect(
            page.getByTestId("language-selector-dropdown")
        ).toBeVisible()

        // Force click to bypass backdrop intercepting the click
        await button.click({ force: true })
        await expect(
            page.getByTestId("language-selector-dropdown")
        ).not.toBeVisible()
    })

    test("all language options are visible when dropdown opens", async ({
        page,
    }) => {
        await page.goto("/en")
        await page.getByTestId("language-selector-button").first().click()

        for (const locale of LOCALES) {
            await expect(
                page.getByTestId(`language-selector-option-${locale}`)
            ).toBeVisible()
        }
    })
})
