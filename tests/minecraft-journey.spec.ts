import { expect, test } from "@playwright/test"

const LOCALES = ["en", "pt-BR", "es", "de"] as const
const MINECRAFT_ROUTES = [
    "minecraft",
    "minecraft/modpacks",
    "minecraft/mods",
    "minecraft/plugins",
    "minecraft/contributions",
    "minecraft/modpacks/hypixel-qol",
]

test.describe("minecraft journey", () => {
    // 1-24: All Minecraft sub-pages load for all locales (6 routes × 4 locales)
    for (const locale of LOCALES) {
        for (const route of MINECRAFT_ROUTES) {
            test(`/${locale}/${route} loads successfully`, async ({ page }) => {
                const response = await page.goto(`/${locale}/${route}`)
                expect(response?.status()).toBe(200)
            })
        }
    }

    // 25: Minecraft landing page has substantial visible content
    test("minecraft landing page has visible content", async ({ page }) => {
        await page.goto("/en/minecraft")

        const bodyContent = await page.textContent("body")
        expect(bodyContent?.length).toBeGreaterThan(100)
    })

    // 26: Minecraft modpacks page has visible content
    test("minecraft modpacks page has visible content", async ({ page }) => {
        await page.goto("/en/minecraft/modpacks")

        const bodyContent = await page.textContent("body")
        expect(bodyContent?.length).toBeGreaterThan(50)
    })

    // 27: Minecraft mods page has visible content
    test("minecraft mods page has visible content", async ({ page }) => {
        await page.goto("/en/minecraft/mods")

        const bodyContent = await page.textContent("body")
        expect(bodyContent?.length).toBeGreaterThan(50)
    })

    // 28: Minecraft plugins page has visible content
    test("minecraft plugins page has visible content", async ({ page }) => {
        await page.goto("/en/minecraft/plugins")

        const bodyContent = await page.textContent("body")
        expect(bodyContent?.length).toBeGreaterThan(50)
    })

    // 29: Minecraft contributions page has visible content
    test("minecraft contributions page has visible content", async ({
        page,
    }) => {
        await page.goto("/en/minecraft/contributions")

        const bodyContent = await page.textContent("body")
        expect(bodyContent?.length).toBeGreaterThan(50)
    })

    // 30: Hypixel QOL modpack page has visible content
    test("hypixel qol modpack page has visible content", async ({ page }) => {
        await page.goto("/en/minecraft/modpacks/hypixel-qol")

        const bodyContent = await page.textContent("body")
        expect(bodyContent?.length).toBeGreaterThan(50)
    })

    // 31: Minecraft nav link is visible on homepage
    test("minecraft nav link visible on homepage", async ({ page }) => {
        await page.goto("/en")

        await expect(page.getByTestId("minecraft-link")).toBeVisible()
    })

    // 32: Navigate from Home to Minecraft via nav link
    test("navigate from home to minecraft via nav link", async ({ page }) => {
        await page.goto("/en")

        await page.getByTestId("minecraft-link").first().click()

        await expect(page).toHaveURL(/\/[a-z-]{2,5}\/minecraft/)
    })

    // 33-36: Minecraft nav link visible on homepage for all locales
    for (const locale of LOCALES) {
        test(`minecraft nav link visible on ${locale} homepage`, async ({
            page,
        }) => {
            await page.goto(`/${locale}`)

            await expect(page.getByTestId("minecraft-link")).toBeVisible()
        })
    }

    // 37-48: Minecraft pages have consistent URL structure for all locales (6 routes × 2 locales)
    for (const locale of ["en", "pt-BR"] as const) {
        for (const route of MINECRAFT_ROUTES) {
            test(`/${locale}/${route} URL is correct`, async ({ page }) => {
                await page.goto(`/${locale}/${route}`)
                await expect(page).toHaveURL(new RegExp(`/${locale}/${route}`))
            })
        }
    }

    // 49: Navigate from Minecraft back to Home
    test("navigate from hypixel qol back to modpacks", async ({ page }) => {
        await page.goto("/en/minecraft/modpacks/hypixel-qol")

        // Hypixel QOL page has inline navigation links (not header dropdown)
        await page
            .getByRole("link", { name: /modpacks/i })
            .first()
            .click()

        await expect(page).toHaveURL(/\/en\/minecraft\/modpacks/)
    })

    // 54: All minecraft pages across all locales return 200 (quick smoke)
    for (const locale of LOCALES) {
        test(`all minecraft pages load for ${locale}`, async ({ page }) => {
            for (const route of MINECRAFT_ROUTES) {
                const response = await page.goto(`/${locale}/${route}`)
                expect(response?.status()).toBe(200)
            }
        })
    }

    // 55-58: Each locale minecraft page has located heading
    for (const locale of LOCALES) {
        test(`${locale} minecraft landing has visible heading`, async ({
            page,
        }) => {
            await page.goto(`/${locale}/minecraft`)

            const heading = page.getByRole("heading").first()
            await expect(heading).toBeVisible()
        })
    }

    // 59: Minecraft modpacks page has at least one link
    test("minecraft modpacks page has links", async ({ page }) => {
        await page.goto("/en/minecraft/modpacks")

        const links = page.getByRole("link")
        const count = await links.count()
        expect(count).toBeGreaterThan(0)
    })

    // 60: Hypixel QOL page has at least one heading
    test("hypixel qol page has a heading", async ({ page }) => {
        await page.goto("/en/minecraft/modpacks/hypixel-qol")

        const heading = page.getByRole("heading").first()
        await expect(heading).toBeVisible()
    })
})
