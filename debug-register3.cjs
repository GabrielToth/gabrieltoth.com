const { chromium } = require("playwright")
const BASE = "http://localhost:3000"

;(async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    page.on("console", msg => {
        if (msg.type() === "error") console.log("[CONSOLE]", msg.text())
    })

    // 1. Go to signin
    await page.goto(BASE + "/en/signin")
    await page.waitForTimeout(1000)
    console.log("Step 1 - URL:", page.url())
    console.log("   H1:", await page.locator("h1").textContent())

    // 2. Click Create Account to switch mode
    await page.getByText("Create Account").first().click()
    await page.waitForTimeout(500)
    console.log("Step 2 - URL:", page.url())
    console.log("   H1:", await page.locator("h1").textContent())

    // 3. Click Sign up with Email
    await page.getByText("Sign up with Email").click()
    await page.waitForTimeout(500)
    console.log("Step 3 - URL:", page.url())
    console.log(
        "   Body snippet:",
        (await page.textContent("body")).substring(0, 200)
    )

    // 4. Fill email and continue
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill("nametest@example.com")
    await page.getByText("Continue").click()
    await page.waitForTimeout(1000)
    console.log("Step 4 - URL:", page.url())
    const body = await page.textContent("body")
    console.log("   Body has text input:", body.includes("input"))
    console.log(
        "   Body has name field:",
        body.includes("name") || body.includes("Name")
    )
    console.log("   Body has Create Account:", body.includes("Create Account"))
    console.log(
        "   Body has password:",
        body.includes("password") || body.includes("Password")
    )

    // Check what inputs are visible
    const textInputs = await page.locator('input[type="text"]').count()
    const pwInputs = await page.locator('input[type="password"]').count()
    console.log("   Text inputs:", textInputs)
    console.log("   Password inputs:", pwInputs)

    // 5. Fill single char name
    if (textInputs > 0) {
        const nameInput = page.locator('input[type="text"]').first()
        await nameInput.fill("A")
        console.log("   Filled name: A")

        // Check for Create Account button
        const createBtns = page.getByText("Create Account")
        const btnCount = await createBtns.count()
        console.log("   Create Account buttons:", btnCount)
        for (let i = 0; i < btnCount; i++) {
            console.log(
                "     btn",
                i,
                "visible:",
                await createBtns.nth(i).isVisible(),
                "enabled:",
                await createBtns.nth(i).isEnabled()
            )
        }

        // Click submit
        if (btnCount > 0) {
            await createBtns.last().click()
            await page.waitForTimeout(1000)

            // Check for error
            const errorText = page.getByText("Please enter your full name")
            console.log(
                "   Error visible:",
                await errorText.isVisible().catch(() => false)
            )
            console.log(
                "   Page content after submit:",
                (await page.textContent("body")).substring(0, 500)
            )
        }
    }

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 500))
    process.exit(1)
})
