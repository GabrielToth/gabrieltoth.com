const { chromium } = require("playwright")
const BASE = "http://localhost:3000"

;(async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    page.on("console", msg =>
        console.log("[PAGE]", msg.type(), msg.text().substring(0, 200))
    )
    page.on("pageerror", err =>
        console.log("[PAGE_ERROR]", err.message?.substring(0, 500))
    )

    await page.goto(BASE + "/en/signin")
    await page.waitForTimeout(1000)

    await page.getByText("Create Account").first().click()
    await page.waitForTimeout(500)

    await page.getByText("Sign up with Email").click()
    await page.waitForTimeout(500)

    // Check what renders after email step
    let html = await page.content()
    console.log("After sign up with email, HTML length:", html.length)
    console.log("Contains <form:", html.includes("<form"))
    console.log("Contains email input:", html.includes('type="email"'))

    // Fill email
    const emailInput = page.locator('input[type="email"]')
    const emailVisible = await emailInput.isVisible()
    console.log("Email input visible:", emailVisible)

    await emailInput.fill("test@example.com")
    await page.getByText("Continue").click()
    await page.waitForTimeout(1000)

    html = await page.content()
    console.log("After Continue, HTML length:", html.length)
    console.log("Contains text input:", html.includes('type="text"'))
    console.log("Contains name input:", html.includes("name"))

    const textInputs = page.locator('input[type="text"]')
    const count = await textInputs.count()
    console.log("Text input count:", count)
    for (let i = 0; i < count; i++) {
        console.log(
            `  input ${i}: visible=${await textInputs.nth(i).isVisible()}, placeholder=${await textInputs
                .nth(i)
                .getAttribute("placeholder")
                .catch(() => "?")}`
        )
    }

    // Fill name and submit
    if (count > 0) {
        await textInputs.first().fill("A")
    }
    await page.getByText("Create Account").last().click()
    await page.waitForTimeout(1000)

    html = await page.content()
    console.log(
        "After submit, HTML contains 'Please enter':",
        html.includes("Please enter your full name")
    )
    console.log("After submit, HTML contains 'error':", html.includes("error"))

    // Check for error display
    const alerts = await page.locator('[class*="red"]').all()
    console.log("Red elements:", alerts.length)
    for (const a of alerts) {
        console.log("  text:", (await a.textContent()).substring(0, 100))
    }

    await browser.close()
})().catch(e => {
    console.error("Script error:", e.message?.substring(0, 500))
    process.exit(1)
})
