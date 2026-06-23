import { chromium } from "playwright"

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto("http://localhost:3000/en")
await page.waitForLoadState("networkidle")

const btn = page.getByTestId("services-button")
console.log("Button count:", await btn.count())
console.log("Button visible:", await btn.isVisible())

const box = await btn.boundingBox()
console.log("Button box:", box)

await btn.click({ timeout: 10000 })
await page.waitForTimeout(500)

const dropdown = page.getByTestId("services-link-channel-management")
console.log("Dropdown count:", await dropdown.count())
if ((await dropdown.count()) > 0) {
    console.log("Dropdown visible:", await dropdown.isVisible())
} else {
    // Check what testIds exist in the DOM
    const allTestIds = await page.evaluate(() => {
        const elements = document.querySelectorAll("[data-testid]")
        return Array.from(elements).map(el => el.getAttribute("data-testid"))
    })
    console.log("All testIds:", allTestIds)
}

await page.screenshot({ path: "debug_services.png", fullPage: true })
console.log("Screenshot saved to debug_services.png")
await browser.close()
