const { chromium } = require("playwright")
const BASE = "http://localhost:3000"

;(async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(BASE + "/en/minecraft/modpacks")
    await page.waitForTimeout(2000)
    console.log("Loaded URL:", page.url())

    // First iteration - click DE
    await page.getByTestId("language-selector-button").first().click()
    await page.waitForTimeout(500)
    await page.getByTestId("language-selector-option-de").click()
    await page.waitForTimeout(3000)
    console.log("After de click URL:", page.url())

    // Second iteration
    const btn2 = page.getByTestId("language-selector-button").first()
    const visible2 = await btn2.isVisible()
    const enabled2 = await btn2.isEnabled()
    console.log("Button on /de page: visible=", visible2, "enabled=", enabled2)

    try {
        await btn2.click({ timeout: 5000 })
        console.log("Clicked button 2")
    } catch (e) {
        console.log("Failed to click button 2:", e.message?.substring(0, 200))
        const dropdown = page.getByTestId("language-selector-dropdown")
        console.log(
            "Dropdown exists:",
            await dropdown.isVisible().catch(() => false)
        )
    }

    await browser.close()
})().catch(e => {
    console.error(e)
    process.exit(1)
})
