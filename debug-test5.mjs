import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()
await page.goto("http://localhost:3000/en")
await page.waitForLoadState("networkidle")

await page.waitForTimeout(3000)

// Check cookies
const cookies = await page.context().cookies()
console.log("Cookies:", cookies)

// Check locale from cookie in JS
const localeFromCookie = await page.evaluate(() => {
    const match = document.cookie.match(/locale=([^;]+)/)
    return match ? match[1] : "no cookie"
})
console.log("Locale cookie (JS):", localeFromCookie)

// Check what the lang attribute says on html
const lang = await page.evaluate(() => document.documentElement.lang)
console.log("HTML lang:", lang)

// Check what next-intl locale context says
const nextIntlLocale = await page.evaluate(() => {
    // Try to find next-intl locale info
    const scripts = document.querySelectorAll("script[id^=__NEXT_DATA__]")
    return scripts.length > 0 ? "found next data" : "no next data"
})
console.log("Next data:", nextIntlLocale)

// Take screenshot
await page.screenshot({ path: "debug_en_page.png", fullPage: true })

// Now check what usePathname would return
const pathCheck = await page.evaluate(() => {
    return window.location.pathname
})
console.log("window.location.pathname:", pathCheck)

// Navigate to /pt-BR and see if the header renders correctly there
await page.goto("http://localhost:3000/pt-BR")
await page.waitForLoadState("networkidle")
await page.waitForTimeout(2000)

const ptbrNav = await page.evaluate(() => {
    const homeLink = document.querySelector('[data-testid="nav-home-desktop"]')
    return homeLink?.getAttribute("href")
})
console.log("pt-BR nav home link:", ptbrNav)

// Click services button on pt-BR
await page.getByTestId("services-button").click()
await page.waitForTimeout(1000)

const ptbrDropdown = await page
    .getByTestId("services-link-channel-management")
    .count()
console.log("pt-BR dropdown count:", ptbrDropdown)

// Show what's rendered in the dropdown
const ptbrAllLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("header a")).map(a => ({
        href: a.getAttribute("href"),
        testId: a.getAttribute("data-testid"),
    }))
})
console.log("pt-BR header links:", JSON.stringify(ptbrAllLinks, null, 2))

await browser.close()
