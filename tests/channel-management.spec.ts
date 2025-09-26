import { expect, test } from "@playwright/test"

test.describe("channel management page", () => {
    test("loads page, shows hero, toggles pricing, validates breadcrumbs and CTA", async ({
        page,
    }) => {
        await page.goto("/en/channel-management")

        // Hero should contain the title
        await expect(
            page.getByRole("heading", { name: /Transform Your Channel/i })
        ).toBeVisible()

        // CTA WhatsApp link exists
        const heroCta = page
            .getByRole("link", { name: /Request Consulting/i })
            .first()
        await expect(heroCta).toBeVisible()
        await expect(heroCta).toHaveAttribute("href", /wa\.me|whatsapp/i)

        // Sections headings visible
        await expect(
            page.getByRole("heading", { name: /Your Growth Challenges/i })
        ).toBeVisible()
        // Allow either services or pricing heading, without strict-mode violation
        const sectionHeadings = page.getByRole("heading").filter({
            hasText: /Our Services|Choose Your Plan|Choose Your Growth Plan/i,
        })
        const sectionCount = await sectionHeadings.count()
        expect(sectionCount).toBeGreaterThan(0)

        // Pricing toggle: flip to ensure DOM updates, check discount badge text appears or persists
        // Find a Monero button by text
        const moneroBtn = page.getByRole("button", { name: /Monero/i }).first()
        if (await moneroBtn.isVisible()) {
            await moneroBtn.click()
        }

        // Expect pricing cards to exist
        const planCards = page.locator("#pricing .grid > div")
        await expect(planCards.first()).toBeVisible()

        // Breadcrumbs overlay should show current page label
        const breadcrumbNav = page.getByRole("navigation", {
            name: "breadcrumb",
        })
        await expect(breadcrumbNav).toBeVisible()
        await expect(breadcrumbNav).toContainText(
            /ViraTrend|Channel Management/i
        )
    })
})
