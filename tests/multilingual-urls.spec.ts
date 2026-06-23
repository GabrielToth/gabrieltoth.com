import { expect, test } from "@playwright/test"

test.describe("multilingual URLs", () => {
    test("PT-BR old URL patterns still serve content", async ({ page }) => {
        // Old URLs still work - they serve content without redirecting
        await page.goto("/pt-BR/channel-management", {
            waitUntil: "networkidle",
        })
        expect(page.url()).toContain("/pt-BR/")

        // Login redirects to signin
        await page.goto("/pt-BR/login", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/pt-BR/")
    })

    test("ES old URL patterns still serve content", async ({ page }) => {
        await page.goto("/es/channel-management", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/es/")

        // Login redirects to signin
        await page.goto("/es/login", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/es/")
    })

    test("DE old URL patterns still serve content", async ({ page }) => {
        await page.goto("/de/channel-management", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/de/")

        // Login redirects to signin
        await page.goto("/de/login", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/de/")
    })

    test("EN URLs serve content correctly", async ({ page }) => {
        await page.goto("/en/channel-management", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/en/channel-management")

        // Login redirects to signin; verify it stays in en locale
        await page.goto("/en/login", { waitUntil: "networkidle" })
        expect(page.url()).toContain("/en/")
        expect(page.url()).toContain("/signin")
    })

    test("Footer ViraTrend link uses locale-prefixed URL", async ({ page }) => {
        // ViraTrend link in footer uses English slug pattern
        await page.goto("/pt-BR", { waitUntil: "networkidle" })
        const channelLink = page.getByRole("link", { name: /ViraTrend/i })
        await expect(channelLink).toHaveAttribute(
            "href",
            "/pt-BR/channel-management/"
        )

        await page.goto("/es", { waitUntil: "networkidle" })
        const channelLinkES = page.getByRole("link", { name: /ViraTrend/i })
        await expect(channelLinkES).toHaveAttribute(
            "href",
            "/es/channel-management/"
        )

        await page.goto("/de", { waitUntil: "networkidle" })
        const channelLinkDE = page.getByRole("link", { name: /ViraTrend/i })
        await expect(channelLinkDE).toHaveAttribute(
            "href",
            "/de/channel-management/"
        )
    })
})
