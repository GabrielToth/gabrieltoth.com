const { chromium } = require("playwright")
const BASE = "http://localhost:3000"

;(async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    page.on("console", msg =>
        console.log("[PAGE " + msg.type() + "]", msg.text().substring(0, 300))
    )
    page.on("pageerror", err =>
        console.log("[ERROR]", err.message?.substring(0, 500))
    )

    await page.goto(BASE + "/en/signin")
    await page.waitForTimeout(1000)
    await page.getByText("Create Account").first().click()
    await page.waitForTimeout(300)
    await page.getByText("Sign up with Email").click()
    await page.waitForTimeout(300)
    await page.locator('input[type="email"]').fill("test@example.com")
    await page.getByText("Continue").click()
    await page.waitForTimeout(500)

    // Wait a bit more for hydration
    await page.waitForTimeout(1000)

    // Now check the form
    const hasForm = await page.evaluate(() => {
        const forms = document.querySelectorAll("form")
        return forms.length > 0
    })
    console.log("Has form element:", hasForm)

    const formHtml = await page.evaluate(() => {
        const forms = document.querySelectorAll("form")
        if (forms.length === 0) return "NO FORMS"
        return Array.from(forms)
            .map(f => f.outerHTML.substring(0, 300))
            .join("\n===\n")
    })
    console.log("Form HTML:", formHtml)

    // Check all inputs
    const allInputs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("input")).map(i => ({
            type: i.type,
            placeholder: i.placeholder,
            required: i.required,
        }))
    })
    console.log("Inputs:", JSON.stringify(allInputs))

    // Check buttons
    const allButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("button")).map(b => ({
            text: b.textContent?.substring(0, 30),
            type: b.type,
        }))
    })
    console.log("Buttons:", JSON.stringify(allButtons))

    if (allInputs.length > 0) {
        // Fill name and submit
        const textInput = page.locator('input[type="text"]').first()
        await textInput.fill("A")
        await page.waitForTimeout(100)

        // Get state value
        const nameValue = await textInput.inputValue()
        console.log("Name input value:", JSON.stringify(nameValue))

        // Submit
        const submitBtn = page.getByText("Create Account").last()
        await submitBtn.click()
        await page.waitForTimeout(1000)

        // Check for error
        const bodyText = await page.textContent("body")
        console.log(
            "After submit body text (first 1000):",
            bodyText.substring(0, 1000)
        )
    }

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 500))
    process.exit(1)
})
