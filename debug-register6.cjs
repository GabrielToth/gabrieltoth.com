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
    await page.waitForTimeout(500)

    // After Continue, we should see the registration form
    // Let's check what's actually in the DOM
    const html = await page.content()

    // Check for the error div pattern
    console.log("Has error class elements:", html.includes("bg-red-100"))
    console.log("Has form onSubmit:", html.includes("onSubmit"))
    console.log("Has handleRegisterSubmit:", html.includes("handleRegister"))

    // Check for Next.js form handling
    console.log("Has data-nextjs-form:", html.includes("data-nextjs"))

    // Check all div classes that could be error containers
    const matches = html.match(/class="[^"]*red[^"]*"/g)
    console.log("Red classes found:", matches ? matches.length : 0)
    if (matches) matches.forEach(m => console.log("  ", m))

    // Check the actual button click
    const submitBtn = page.getByText("Create Account").last()
    const tagName = await submitBtn.evaluate(el => el.tagName)
    const type = await submitBtn.getAttribute("type")
    console.log("Button tag:", tagName, "type:", type)

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 500))
    process.exit(1)
})
