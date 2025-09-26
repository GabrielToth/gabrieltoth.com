import { expect, test } from "@playwright/test"

test.describe("editors page", () => {
    test("loads page, shows hero, lists sections, CTA WhatsApp works, breadcrumbs visible", async ({
        page,
    }) => {
        await page.goto("/en/editors")

        // Hero heading and CTA
        await expect(
            page.getByRole("heading", {
                name: /We're Looking for Talented Editors|Looking for Talented Editors|Editors/i,
            })
        ).toBeVisible()
        const ctaBtn = page
            .getByRole("link", { name: /Apply|Contact|WhatsApp|Start/i })
            .first()
        await expect(ctaBtn).toBeVisible()
        await expect(ctaBtn).toHaveAttribute("href", /wa\.me|whatsapp/i)

        // Sections headings
        const headings = page.getByRole("heading")
        const expected = [
            /Why Work With Us\?/i,
            /Tools We Use/i,
            /Requirements/i,
            /Benefits/i,
        ]
        for (const rx of expected) {
            await expect(headings.filter({ hasText: rx }).first()).toBeVisible()
        }

        // Structured data should be present
        const ldNodes = page.locator('script[type="application/ld+json"]')
        await expect(ldNodes.first()).toBeVisible()

        // Breadcrumbs visible
        const breadcrumbNav = page.getByRole("navigation", {
            name: "breadcrumb",
        })
        await expect(breadcrumbNav).toBeVisible()
    })
})
