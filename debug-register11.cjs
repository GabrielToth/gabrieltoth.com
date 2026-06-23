const { chromium } = require("playwright")
const BASE = "http://localhost:3000"

;(async () => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(BASE + "/en/signin")
    await page.waitForTimeout(1000)

    // Check body content
    const bodyHtml = await page.evaluate(() => {
        // Find the main content div (the one that wraps the page content, not head)
        const mainDiv = document.querySelector("div.min-h-screen")
        if (mainDiv) return mainDiv.outerHTML.substring(0, 3000)
        // Fallback: get all body children
        return Array.from(document.body.children)
            .map(c => c.outerHTML.substring(0, 300))
            .join("\n---\n")
    })
    console.log("Body content:", bodyHtml)

    await browser.close()
})().catch(e => {
    console.error("Error:", e.message?.substring(0, 500))
    process.exit(1)
})
