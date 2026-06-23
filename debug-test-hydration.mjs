import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()

// Listen for console errors
page.on("console", msg => {
    if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text())
})

await page.goto("http://localhost:3000/en")
await page.waitForLoadState("networkidle")
await page.waitForTimeout(2000)

// Check the actual pathname at component render time
const headerState = await page.evaluate(() => {
    const header = document.querySelector("header")
    const homeLink = header?.querySelector('[data-testid="nav-home-desktop"]')
    return {
        homeHref: homeLink?.getAttribute("href"),
        pathname: window.location.pathname,
        lang: document.documentElement.lang,
    }
})
console.log("Header state:", JSON.stringify(headerState, null, 2))

// Now click the services button
await page.getByTestId("services-button").click()
await page.waitForTimeout(500)

// Check if dropdown rendered
const dropdownLinks = await page.evaluate(() => {
    const header = document.querySelector("header")
    const servicesSection = header?.querySelector("nav > div.relative")
    if (!servicesSection) return "no services section"
    return Array.from(servicesSection.querySelectorAll("a")).map(a => ({
        href: a.getAttribute("href"),
        testId: a.getAttribute("data-testid"),
    }))
})
console.log("Dropdown links:", JSON.stringify(dropdownLinks, null, 2))

// Also verify what the click handler does
await page.evaluate(() => {
    // Check React fiber for isServicesOpen
    const btn = document.querySelector('[data-testid="services-button"]')
    const key = Object.keys(btn).find(k => k.startsWith("__reactFiber"))
    // Not reliable, but let's try
})

await browser.close()
