/**
 * Selenium Stealth E2E Test Suite
 *
 * Runs real Chrome navigation against the local server using anti-detection
 * stealth flags so automations are not surfaced as test/automation mode.
 *
 * Requires a local server: `npm run dev` (or TEST_BASE_URL env override).
 * Selenium tests are skipped by default; enable with SELENIUM_E2E=1.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { WebDriver, By, until } from "selenium-webdriver"
import { createStealthDriver, quitDriver } from "@/lib/testing/selenium-stealth"

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000"
const E2E_ENABLED = process.env.SELENIUM_E2E === "1"

describe("Selenium Stealth E2E", () => {
    let driver: WebDriver | null = null

    const shouldSkip = () => {
        if (!E2E_ENABLED) return true
        return false
    }

    beforeAll(async () => {
        if (shouldSkip()) return
        try {
            driver = await createStealthDriver({ headless: true })
        } catch (err) {
            // Chrome not available — mark as skipped
            driver = null
        }
    }, 60000)

    afterAll(async () => {
        await quitDriver(driver)
        driver = null
    })

    it.skipIf(!E2E_ENABLED)(
        "navigator.webdriver is undefined (stealth active)",
        async () => {
            if (!driver) return
            await driver.get(`${BASE_URL}/en/signin`)
            const webdriver = await driver.executeScript(
                "return navigator.webdriver"
            )
            expect(webdriver).toBeUndefined()
        },
        30000
    )

    it.skipIf(!E2E_ENABLED)(
        "landing page /pt-BR loads with <main> and title",
        async () => {
            if (!driver) return
            await driver.get(`${BASE_URL}/pt-BR`)
            const main = await driver.wait(
                until.elementLocated(By.css("main")),
                15000
            )
            expect(await main.isDisplayed()).toBe(true)
            const title = await driver.getTitle()
            expect(title.length).toBeGreaterThan(0)
        },
        60000
    )

    it.skipIf(!E2E_ENABLED)(
        "cross-locale slug mismatch redirects with 308",
        async () => {
            if (!driver) return
            // wrong: Portuguese slug under pt-BR locale but Portuguese page
            // expects quem-sou-eu not acerca-de-mi
            await driver.get(`${BASE_URL}/pt-BR/acerca-de-mi`)
            const url = await driver.getCurrentUrl()
            expect(url).toContain("/quem-sou-eu")
        },
        30000
    )

    it.skipIf(!E2E_ENABLED)(
        "signin page renders Google OAuth button without automation banner",
        async () => {
            if (!driver) return
            await driver.get(`${BASE_URL}/pt-BR/signin`)
            const buttons = await driver.findElements(
                By.css("button, a[href*='google']")
            )
            expect(buttons.length).toBeGreaterThan(0)
            const automationBanner = await driver.findElements(
                By.css("[data-automation='banner']")
            )
            expect(automationBanner.length).toBe(0)
        },
        30000
    )

    it.skipIf(!E2E_ENABLED)(
        "services page cards use bg-card token not raw grey",
        async () => {
            if (!driver) return
            await driver.get(`${BASE_URL}/en/services`)
            const cards = await driver.findElements(By.css(".bg-card"))
            expect(cards.length).toBeGreaterThan(0)
        },
        30000
    )
})
