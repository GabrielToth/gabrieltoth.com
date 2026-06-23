const { chromium } = require("playwright")
const BASE = "http://localhost:3000"

;(async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(BASE + "/en/signin")
    await page.waitForTimeout(1000)
    console.log("URL:", page.url())

    await page.getByText("Create Account").first().click()
    await page.waitForTimeout(500)
    console.log("After Create Account - URL:", page.url())
    console.log("H1:", await page.locator("h1").textContent())

    await page.getByText("Sign up with Email").click()
    await page.waitForTimeout(500)
    console.log("After Sign up with Email - URL:", page.url())

    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill("testuser@example.com")
    await page.getByText("Continue").click()
    await page.waitForTimeout(2000)
    console.log("After Continue - URL:", page.url())
    console.log("Body:", (await page.textContent("body")).substring(0, 500))

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 300))
    process.exit(1)
})
