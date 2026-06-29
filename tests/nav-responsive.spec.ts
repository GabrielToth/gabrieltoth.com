import { expect, test } from "@playwright/test"

test.describe("header responsive navigation", () => {
    test("full desktop nav visible at 900px, hamburger hidden", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 900, height: 800 })
        await page.goto("/en")

        await expect(page.getByTestId("nav-home-desktop")).toBeVisible()
        await expect(page.getByTestId("minecraft-link")).toBeVisible()
        await expect(page.getByTestId("services-button")).toBeVisible()
        await expect(page.getByTestId("nav-login")).toBeVisible()
        await expect(page.getByTestId("mobile-menu-toggle")).not.toBeVisible()

        // Mid tier elements must NOT be visible at desktop width
        await expect(page.getByTestId("nav-about-mid")).not.toBeVisible()
    })

    test("mid tier 1: About + Services + Minecraft visible at 820px", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 820, height: 800 })
        await page.goto("/en")

        // Mid nav items should be visible
        await expect(page.getByTestId("nav-about-mid")).toBeVisible()
        await expect(page.getByTestId("services-button-mid")).toBeVisible()
        await expect(page.getByTestId("minecraft-link-mid")).toBeVisible()

        // Desktop nav should be hidden
        await expect(page.getByTestId("nav-home-desktop")).not.toBeVisible()

        // Hamburger should be visible
        await expect(page.getByTestId("mobile-menu-toggle")).toBeVisible()
    })

    test("mid tier 2: Only About + Services visible at 700px, Minecraft hidden", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 700, height: 800 })
        await page.goto("/en")

        await expect(page.getByTestId("nav-about-mid-sm")).toBeVisible()
        await expect(page.getByTestId("services-button-mid-sm")).toBeVisible()

        // Minecraft should NOT be visible in top bar
        await expect(page.getByTestId("minecraft-link-mid")).not.toBeVisible()

        await expect(page.getByTestId("nav-home-desktop")).not.toBeVisible()

        await expect(page.getByTestId("mobile-menu-toggle")).toBeVisible()
    })

    test("mobile: only hamburger and logo visible at 500px", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 500, height: 800 })
        await page.goto("/en")

        await expect(page.getByTestId("nav-about-mid-sm")).not.toBeVisible()
        await expect(page.getByTestId("nav-about-mid")).not.toBeVisible()
        await expect(page.getByTestId("nav-home-desktop")).not.toBeVisible()
        await expect(page.getByTestId("mobile-menu-toggle")).toBeVisible()
        await expect(page.getByTestId("nav-home")).toBeVisible()
    })

    test("Services dropdown opens in mid tier 1", async ({ page }) => {
        await page.setViewportSize({ width: 820, height: 800 })
        await page.goto("/en")

        await page.getByTestId("services-button-mid").click()

        await expect(
            page.getByTestId("services-link-t1-channel-management")
        ).toBeVisible()

        await page.getByTestId("services-link-t1-channel-management").click()

        await expect(page).toHaveURL(/\/channel-management/)
    })

    test("Minecraft dropdown opens in mid tier 1", async ({ page }) => {
        await page.setViewportSize({ width: 820, height: 800 })
        await page.goto("/en")

        await page.getByTestId("minecraft-link-mid").hover()
        await page.getByTestId("minecraft-dropdown-button-mid").click()

        // Minecraft modpacks should be visible in the dropdown
        await expect(
            page.getByTestId("minecraft-link-modpacks-mid")
        ).toBeVisible()

        await page.getByTestId("minecraft-link-modpacks-mid").click()
        await expect(page).toHaveURL(/\/modpacks/)
    })

    test("Services dropdown opens in mid tier 2 (640-768px)", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 700, height: 800 })
        await page.goto("/en")

        await page.getByTestId("services-button-mid-sm").click()

        await expect(
            page.getByTestId("services-link-t2-channel-management")
        ).toBeVisible()

        await page.getByTestId("services-link-t2-channel-management").click()

        await expect(page).toHaveURL(/\/channel-management/)
    })

    test("desktop: opening one dropdown closes the other", async ({ page }) => {
        await page.setViewportSize({ width: 900, height: 800 })
        await page.goto("/en")

        // Open Services — verify Minecraft dropdown is not visible
        await page.getByTestId("services-button").click()
        await expect(
            page.getByTestId("services-link-channel-management")
        ).toBeVisible()
        await expect(
            page.getByTestId("minecraft-link-modpacks")
        ).not.toBeVisible()

        // Open Minecraft — Services should close
        await page.getByTestId("minecraft-dropdown-button").click()
        await expect(page.getByTestId("minecraft-link-modpacks")).toBeVisible()
        await expect(
            page.getByTestId("services-link-channel-management")
        ).not.toBeVisible()

        // Open Services again — Minecraft should close
        await page.getByTestId("services-button").click()
        await expect(
            page.getByTestId("services-link-channel-management")
        ).toBeVisible()
        await expect(
            page.getByTestId("minecraft-link-modpacks")
        ).not.toBeVisible()
    })

    test("mid tier 1: opening one dropdown closes the other", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 820, height: 800 })
        await page.goto("/en")

        // Open Services — verify Minecraft dropdown is not visible
        await page.getByTestId("services-button-mid").click()
        await expect(
            page.getByTestId("services-link-t1-channel-management")
        ).toBeVisible()
        await expect(
            page.getByTestId("minecraft-link-modpacks-mid")
        ).not.toBeVisible()

        // Open Minecraft — Services should close
        await page.getByTestId("minecraft-dropdown-button-mid").click()
        await expect(
            page.getByTestId("minecraft-link-modpacks-mid")
        ).toBeVisible()
        await expect(
            page.getByTestId("services-link-t1-channel-management")
        ).not.toBeVisible()
    })

    test("mid tier 1: elements hidden when hamburger opened", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 820, height: 800 })
        await page.goto("/en")

        // Verify mid tier 1 is visible before opening hamburger
        await expect(page.getByTestId("nav-about-mid")).toBeVisible()

        // Open hamburger
        await page.getByTestId("mobile-menu-toggle").click()

        // Mid tier 1 should now be hidden
        await expect(page.getByTestId("nav-about-mid")).not.toBeVisible()
        await expect(page.getByTestId("services-button-mid")).not.toBeVisible()
        await expect(page.getByTestId("minecraft-link-mid")).not.toBeVisible()

        // Mobile nav should be visible
        await expect(page.getByTestId("mobile-nav")).toBeVisible()

        // Close hamburger — mid tier 1 should reappear
        await page.getByTestId("mobile-menu-toggle").click()
        await expect(page.getByTestId("nav-about-mid")).toBeVisible()
    })

    test("mid tier 2: elements hidden when hamburger opened", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 700, height: 800 })
        await page.goto("/en")

        // Verify mid tier 2 is visible before opening hamburger
        await expect(page.getByTestId("nav-about-mid-sm")).toBeVisible()

        // Open hamburger
        await page.getByTestId("mobile-menu-toggle").click()

        // Mid tier 2 should now be hidden
        await expect(page.getByTestId("nav-about-mid-sm")).not.toBeVisible()
        await expect(
            page.getByTestId("services-button-mid-sm")
        ).not.toBeVisible()

        // Mobile nav should be visible
        await expect(page.getByTestId("mobile-nav")).toBeVisible()

        // Close hamburger — mid tier 2 should reappear
        await page.getByTestId("mobile-menu-toggle").click()
        await expect(page.getByTestId("nav-about-mid-sm")).toBeVisible()
    })

    test("open dropdown closes when hamburger is opened", async ({ page }) => {
        await page.setViewportSize({ width: 820, height: 800 })
        await page.goto("/en")

        // Open Services in mid tier 1
        await page.getByTestId("services-button-mid").click()
        await expect(
            page.getByTestId("services-link-t1-channel-management")
        ).toBeVisible()

        // Open hamburger — Services dropdown should close
        await page.getByTestId("mobile-menu-toggle").click()
        await expect(
            page.getByTestId("services-link-t1-channel-management")
        ).not.toBeVisible()

        // Mobile nav should be visible
        await expect(page.getByTestId("mobile-nav")).toBeVisible()
    })

    test("no horizontal overflow at mid breakpoints", async ({ page }) => {
        // Check at mid tier 1 boundary
        await page.setViewportSize({ width: 768, height: 800 })
        await page.goto("/en")
        let overflow = await page.evaluate(() => {
            const header = document.querySelector("header")
            if (!header) return false
            return header.scrollWidth > header.clientWidth
        })
        expect(overflow).toBe(false)

        // Check at mid tier 2 boundary
        await page.setViewportSize({ width: 640, height: 800 })
        await page.goto("/en")
        overflow = await page.evaluate(() => {
            const header = document.querySelector("header")
            if (!header) return false
            return header.scrollWidth > header.clientWidth
        })
        expect(overflow).toBe(false)
    })
})
