import { chromium } from "playwright"

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto("http://localhost:3000/en/channel-management")
await page.waitForTimeout(2000)

const result = await page.evaluate(() => {
    const cmLink = document.querySelector('a[href*="channel-management"]')
    const href = cmLink ? cmLink.getAttribute("href") : "not found"
    const pathname = window.location.pathname
    return { href, pathname }
})

console.log(JSON.stringify(result))
await browser.close()
