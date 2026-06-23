const { chromium } = require("playwright")
const BASE = "http://localhost:3000"

;(async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    page.on("console", msg => {
        if (msg.type() === "error" || msg.type() === "warning") {
            console.log(`[${msg.type()}] ${msg.text()}`)
        }
    })
    page.on("pageerror", err => {
        console.log("[PAGE ERROR]", err.message?.substring(0, 300))
    })
    page.on("response", response => {
        if (response.status() >= 400) {
            console.log(
                `[HTTP ${response.status()}] ${response.url().substring(0, 100)}`
            )
        }
    })

    await page.goto(BASE + "/en/signin")
    await page.waitForTimeout(1000)
    console.log("--- Clicking Create Account ---")
    await page.getByText("Create Account").first().click()
    await page.waitForTimeout(500)

    console.log("--- Clicking Sign up with Email ---")
    await page.getByText("Sign up with Email").click()
    await page.waitForTimeout(500)

    console.log("--- Filling email ---")
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill("testuser@example.com")

    console.log("--- Clicking Continue ---")
    await page.getByText("Continue").click()
    await page.waitForTimeout(3000)

    console.log("--- After Continue ---")
    console.log("URL:", page.url())
    const html = await page.content()
    console.log("Page HTML length:", html.length)
    console.log(
        "Page has sign-in form:",
        html.includes("sign-in-form") ||
            html.includes("Sign In") ||
            html.includes("Create Account")
    )

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 300))
    process.exit(1)
})
