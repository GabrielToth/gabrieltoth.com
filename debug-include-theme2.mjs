import { chromium } from "playwright"

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto("http://localhost:3000/en/channel-management")
await page.waitForTimeout(3000)

await page.getByTestId("language-selector-button").first().click()
await page.waitForTimeout(500)

// Check the dropdown content
const dropdown = page.getByTestId("language-selector-dropdown")
const html = await dropdown.innerHTML()
console.log("Dropdown HTML:", html.substring(0, 2000))

// Check for menuitems with theme text
const items = page.getByRole("menuitem")
const count = await items.count()
console.log("Menuitem count:", count)
for (let i = 0; i < count; i++) {
    const text = await items.nth(i).textContent()
    console.log("  menuitem", i, ":", JSON.stringify(text))
}

await browser.close()
