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

    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill("test@example.com")
    await page.getByText("Continue").click()
    await page.waitForTimeout(500)

    const textInput = page.locator('input[type="text"]').first()
    await textInput.fill("A")
    await page.getByText("Create Account").last().click()
    await page.waitForTimeout(1000)

    // Get all text content to find the error
    const bodyText = await page.textContent("body")
    // Find error-related text
    const lines = bodyText
        .split("\n")
        .filter(
            l =>
                l.includes("name") ||
                l.includes("Name") ||
                l.includes("full") ||
                l.includes("error") ||
                l.includes("Error") ||
                l.includes("required") ||
                l.includes("length")
        )
    console.log("Relevant lines:", lines.join("\n").substring(0, 2000))

    // Check form content specifically
    const formContent = await page.evaluate(() => {
        const forms = document.querySelectorAll("form")
        if (forms.length === 0) return "No forms found"
        return Array.from(forms)
            .map(f => f.textContent?.substring(0, 500))
            .join("\n---\n")
    })
    console.log("Form content:", formContent)

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 500))
    process.exit(1)
})
