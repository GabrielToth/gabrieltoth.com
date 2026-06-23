const { chromium } = require("playwright")
const BASE = "http://localhost:3000"

;(async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // Capture ALL errors
    page.on("console", msg =>
        console.log(
            "[CONSOLE " + msg.type() + "]",
            msg.text().substring(0, 500)
        )
    )
    page.on("pageerror", err =>
        console.log("[PAGE_ERROR]", err.message?.substring(0, 500))
    )
    page.on("crash", () => console.log("[CRASH]"))

    await page.goto(BASE + "/en/signin")
    await page.waitForTimeout(1000)
    await page.getByText("Create Account").first().click()
    await page.waitForTimeout(300)
    await page.getByText("Sign up with Email").click()
    await page.waitForTimeout(300)
    await page.locator('input[type="email"]').fill("test@example.com")

    // Use force click to bypass any overlay
    const continueBtn = page.getByText("Continue")
    await continueBtn.click({ force: true })
    await page.waitForTimeout(1000)

    await page.locator('input[type="text"]').first().fill("A")
    await page.waitForTimeout(100)

    const submitBtn = page.getByText("Create Account").last()
    console.log("About to click submit...")
    await submitBtn.click({ force: true })
    await page.waitForTimeout(2000)
    console.log("After submit, URL:", page.url())

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 500))
    process.exit(1)
})
