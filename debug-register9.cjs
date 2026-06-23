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

    // Check DOM before submit
    let domState = await page.evaluate(() => ({
        rootExists: !!document.getElementById("__next"),
        rootContent:
            document.getElementById("__next")?.textContent?.substring(0, 200) ||
            "none",
        bodyChildren: document.body.children.length,
        firstChildTag: document.body.children[0]?.tagName || "none",
    }))
    console.log("Before submit:", JSON.stringify(domState))

    await page.locator('input[type="text"]').first().fill("A")
    await page.waitForTimeout(100)
    await page.getByText("Create Account").last().click()
    await page.waitForTimeout(1000)

    // Check DOM after submit
    domState = await page.evaluate(() => ({
        rootExists: !!document.getElementById("__next"),
        rootContent:
            document.getElementById("__next")?.textContent?.substring(0, 200) ||
            "none",
        bodyChildren: document.body.children.length,
        firstChildTag: document.body.children[0]?.tagName || "none",
        allText: document.body.textContent?.substring(0, 500) || "none",
    }))
    console.log("After submit:", JSON.stringify(domState))

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 500))
    process.exit(1)
})
