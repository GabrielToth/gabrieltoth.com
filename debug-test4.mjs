import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()
await page.goto("http://localhost:3000/en")
await page.waitForLoadState("networkidle")

// Wait longer for hydration and locale to settle
await page.waitForTimeout(3000)

// Check current locale in header
const localeInHeader = await page.evaluate(() => {
    const homeLink = document.querySelector('[data-testid="nav-home-desktop"]')
    if (!homeLink) return "link not found"
    const href = homeLink.getAttribute("href")
    // Extract locale from href
    const match = href?.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)/)
    return match ? match[1] : href
})
console.log("Locale in header:", localeInHeader)

const testIds = await page.evaluate(() => {
    const els = document.querySelectorAll("[data-testid]")
    return Array.from(els).map(el => el.getAttribute("data-testid"))
})
console.log("TestIds:", testIds.filter(Boolean))

// Now click and check
await page.getByTestId("services-button").click()
await page.waitForTimeout(1000)

const dropdownCount = await page
    .getByTestId("services-link-channel-management")
    .count()
console.log("Dropdown items after wait+click:", dropdownCount)

if (dropdownCount === 0) {
    // Check all links visible
    const allLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a")).map(a =>
            a.getAttribute("href")
        )
    })
    console.log("All links:", allLinks.filter(Boolean))

    // Maybe the header wasn't even rendered
    const headerEl = await page.evaluate(() => {
        const header = document.querySelector("header")
        if (!header) return "no header"
        return header.querySelector('[data-testid="services-button"]')
            ? "has button"
            : "no button in header"
    })
    console.log("Header status:", headerEl)
}

await browser.close()
