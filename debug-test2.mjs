import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()

// Listen for console messages
page.on("console", msg => console.log("CONSOLE:", msg.type(), msg.text()))

// Monkey-patch the click to add debug
await page.goto("http://localhost:3000/en")
await page.waitForLoadState("networkidle")

// Try force click
const btn = page.getByTestId("services-button")
console.log("Button found, clicking...")
await btn.click({ force: true })
await page.waitForTimeout(1000)

const dropdown = page.getByTestId("services-link-channel-management")
console.log("After force click, dropdown count:", await dropdown.count())

// Try hovering first
await page.mouse.move(761, 32)
await page.waitForTimeout(500)
await page.mouse.click(761, 32)
await page.waitForTimeout(1000)
console.log("After hover+click, dropdown count:", await dropdown.count())

// Check the HTML
const html = await page.evaluate(() => {
    const nav = document.querySelector("nav.hidden.md\\:flex")
    if (!nav) return "nav not found"
    return nav.innerHTML.substring(0, 2000)
})
console.log("Nav HTML:", html)

await page.screenshot({ path: "debug_services2.png", fullPage: true })
await browser.close()
