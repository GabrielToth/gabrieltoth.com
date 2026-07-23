import { test } from "@playwright/test"

const BASE = "https://www.gabrieltoth.com"

test.use({
    headless: false,
    slowMo: 500,
})

test.describe("auth flow", () => {
    test("login via Google, interactive dashboard, logout", async ({ page }) => {
        test.setTimeout(600000)
        console.log("Waiting 3 minutes for build to deploy...")
        await page.waitForTimeout(180000)
        console.log("Starting test...")

        // Step 1: Navigate to home page
        await page.goto(`${BASE}/pt-BR`, { waitUntil: "networkidle" })
        console.log("Home page loaded")

        // Step 2: Click "Entrar" button
        await page.waitForTimeout(1000)
        await page.click('[data-testid="nav-login"]')
        console.log("Clicked Entrar")

        // Step 3: Wait for redirect to /pt-BR/signin
        await page.waitForURL(`${BASE}/pt-BR/signin`, { timeout: 15000 })
        console.log("At signin page")

        // Step 4: Click "Entrar com Google"
        await page.click("button:has-text('Entrar com Google')")
        console.log("Redirecting to Google OAuth...")

        // Step 5: User authenticates manually on Google OAuth page
        // After Google auth, redirects to /api/auth/google/callback
        // then server redirects to /dashboard
        await page.waitForURL(`${BASE}/dashboard`, { timeout: 120000 })
        console.log("At dashboard — interactive mode")

        // Step 6: PAUSE — user adds tests interactively here
        // Resume by clicking "Resume" in Playwright Inspector or pressing F8
        console.log("PAUSED. Add your tests in the Inspector, then resume to continue to logout.")
        await page.pause()

        // Step 7: Click "Sair" (logout)
        console.log("Logging out...")
        await page.click("button:has-text('Sair')")

        // Verify redirect to login page
        await page.waitForURL(/\/pt-BR\/(entrar|login)/, { timeout: 15000 })
        console.log("Logout complete")
    })
})
