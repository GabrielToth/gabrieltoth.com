const { chromium } = require("playwright")
const BASE = "http://localhost:3000"

;(async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(BASE + "/en/signin")
    await page.waitForTimeout(1000)
    await page.getByText("Create Account").first().click()
    await page.waitForTimeout(300)
    await page.getByText("Sign up with Email").click()
    await page.waitForTimeout(300)
    await page.locator('input[type="email"]').fill("test@example.com")
    await page.getByText("Continue").click()
    await page.waitForTimeout(1000)

    const html = await page.evaluate(() => {
        const darkDiv = document.querySelector(".dark")
        return darkDiv ? darkDiv.innerHTML.substring(0, 5000) : "no dark div"
    })
    console.log(html)

    await page.locator('input[type="text"]').first().fill("A")
    await page.waitForTimeout(100)
    await page.getByText("Create Account").last().click()
    await page.waitForTimeout(1000)

    const htmlAfter = await page.evaluate(() => {
        const darkDiv = document.querySelector(".dark")
        return darkDiv ? darkDiv.innerHTML.substring(0, 5000) : "no dark div"
    })
    console.log("--- AFTER SUBMIT ---")
    console.log(htmlAfter)

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 500))
    process.exit(1)
})
