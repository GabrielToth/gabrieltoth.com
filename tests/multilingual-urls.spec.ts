import { expect, test } from "@playwright/test"

test.describe("multilingual URLs", () => {
    test("PT-BR old URLs redirect to new translated URLs", async ({ page }) => {
        // Test channel-management redirect
        await page.goto("/pt-BR/channel-management", {
            waitUntil: "networkidle",
        })
        expect(page.url()).toContain("/pt-BR/gerenciamento-de-canais")

        // Test pc-optimization redirect
        await page.goto("/pt-BR/pc-optimization", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/pt-BR/otimizacao-de-pc")

        // Test editors redirect
        await page.goto("/pt-BR/editors", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/pt-BR/editores")

        // Test login redirect
        await page.goto("/pt-BR/login", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/pt-BR/entrar")

        // Test register redirect
        await page.goto("/pt-BR/register", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/pt-BR/registrar")
    })

    test("ES old URLs redirect to new translated URLs", async ({ page }) => {
        // Test channel-management redirect
        await page.goto("/es/channel-management", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/es/gestion-de-canales")

        // Test pc-optimization redirect
        await page.goto("/es/pc-optimization", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/es/optimizacion-de-pc")

        // Test login redirect
        await page.goto("/es/login", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/es/iniciar-sesion")
    })

    test("DE old URLs redirect to new translated URLs", async ({ page }) => {
        // Test channel-management redirect
        await page.goto("/de/channel-management", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/de/kanalverwaltung")

        // Test pc-optimization redirect
        await page.goto("/de/pc-optimization", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/de/pc-optimierung")

        // Test login redirect
        await page.goto("/de/login", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/de/anmelden")
    })

    test("EN URLs remain unchanged", async ({ page }) => {
        // Test that EN URLs don't redirect
        await page.goto("/en/channel-management", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/en/channel-management")

        await page.goto("/en/login", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/en/login")
    })

    test("Header uses localized URLs", async ({ page }) => {
        // Test PT-BR header links
        await page.goto("/pt-BR", { waitUntil: "networkidle" })
        const channelLink = page.getByRole("link", { name: /ViraTrend/i })
        await expect(channelLink).toHaveAttribute(
            "href",
            "/pt-BR/gerenciamento-de-canais"
        )

        // Test ES header links
        await page.goto("/es", { waitUntil: "networkidle" })
        const channelLinkES = page.getByRole("link", { name: /ViraTrend/i })
        await expect(channelLinkES).toHaveAttribute(
            "href",
            "/es/gestion-de-canales"
        )

        // Test DE header links
        await page.goto("/de", { waitUntil: "networkidle" })
        const channelLinkDE = page.getByRole("link", { name: /ViraTrend/i })
        await expect(channelLinkDE).toHaveAttribute(
            "href",
            "/de/kanalverwaltung"
        )
    })
})
