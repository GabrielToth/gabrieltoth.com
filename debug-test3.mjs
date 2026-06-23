import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage({ locale: "en-US" })

// Set Accept-Language header
await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" })

console.log("Navigating to /en...")
const resp = await page.goto("http://localhost:3000/en", {
    waitUntil: "networkidle",
})
console.log("Final URL:", page.url())
console.log("Response status:", resp?.status())

// Check what the locale actually is
const locale = await page.evaluate(() => {
    const html = document.documentElement
    return html.getAttribute("lang") || "not found"
})
console.log("HTML lang attribute:", locale)

// Check all testIds
const testIds = await page.evaluate(() => {
    const els = document.querySelectorAll("[data-testid]")
    return Array.from(els).map(el => el.getAttribute("data-testid"))
})
console.log("All testIds:", testIds)

// Get the services button html
const btnHtml = await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="services-button"]')
    return btn ? btn.outerHTML : "not found"
})
console.log("Button HTML:", btnHtml)

// Try clicking and check state
await page.getByTestId("services-button").click()
await page.waitForTimeout(1000)

// Check if dropdown exists now
const hasDropdown = await page.evaluate(() => {
    return !!document.querySelector(
        '[data-testid="services-link-channel-management"]'
    )
})
console.log("Has dropdown after click:", hasDropdown)

// Let's also check all rendered hrefs in the services section
const allLinks = await page.evaluate(() => {
    const links = document.querySelectorAll("a")
    return Array.from(links)
        .map(l => l.getAttribute("href"))
        .filter(Boolean)
})
console.log("All hrefs:", allLinks)

await browser.close()
