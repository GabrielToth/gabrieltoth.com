import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()

await page.goto("http://localhost:3000/en")
await page.waitForLoadState("networkidle")
await page.waitForTimeout(2000)

const headerHref = await page.evaluate(() => {
    const homeLink = document.querySelector('[data-testid="nav-home-desktop"]')
    return homeLink?.getAttribute("href")
})
console.log("Nav home-desktop href:", headerHref)

// Now try services dropdown
await page.getByTestId("services-button").click()
await page.waitForTimeout(500)

const dropdownItems = await page
    .getByTestId("services-link-channel-management")
    .count()
console.log("Dropdown channel-management count:", dropdownItems)

if (dropdownItems > 0) {
    const isVisible = await page
        .getByTestId("services-link-channel-management")
        .first()
        .isVisible()
    console.log("Dropdown visible:", isVisible)
}

// Take a screenshot
await page.screenshot({ path: "debug_fix_verify.png" })

await browser.close()
