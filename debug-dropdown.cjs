const { chromium } = require("playwright")
const BASE = "http://localhost:3000"

;(async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
    })

    await page.goto(BASE + "/en")
    await page.waitForTimeout(2000)

    const button = page.getByTestId("language-selector-button").first()
    const dropdown = page.getByTestId("language-selector-dropdown")

    // First click - open
    await button.click()
    await page.waitForTimeout(500)
    console.log("After first click:")
    console.log(
        "  dropdown visible:",
        await dropdown.isVisible().catch(() => false)
    )
    console.log("  dropdown exists:", (await dropdown.count()) > 0)

    // Second click - close
    await button.click()
    await page.waitForTimeout(500)
    console.log("After second click:")
    console.log(
        "  dropdown visible:",
        await dropdown.isVisible().catch(() => false)
    )
    console.log("  dropdown exists:", (await dropdown.count()) > 0)

    // Check the actual state via evaluate
    const state = await page.evaluate(() => {
        const langSelector = document.querySelector(
            '[data-testid="language-selector"]'
        )
        if (!langSelector) return { found: false }
        const button = langSelector.querySelector(
            '[data-testid="language-selector-button"]'
        )
        const dropdown = langSelector.querySelector(
            '[data-testid="language-selector-dropdown"]'
        )
        return {
            found: true,
            buttonAriaExpanded: button?.getAttribute("aria-expanded"),
            dropdownExists: !!dropdown,
        }
    })
    console.log("State via evaluate:", JSON.stringify(state))

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 500))
    process.exit(1)
})
