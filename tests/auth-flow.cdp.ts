import { chromium } from "playwright"
import { execSync, spawn } from "child_process"
import { setTimeout } from "timers/promises"
import readline from "readline"
import http from "http"

const CDP_PORT = 9222
const BASE = "https://www.gabrieltoth.com"
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"

function question(query: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    return new Promise((resolve) => rl.question(query, (a) => { rl.close(); resolve(a) }))
}

async function httpGet(url: string): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => { res.resume(); resolve(res.statusCode === 200) })
        req.on("error", () => resolve(false))
        req.setTimeout(2000, () => { req.destroy(); resolve(false) })
    })
}

async function waitForChrome(port: number, retries = 30) {
    for (let i = 0; i < retries; i++) {
        if (await httpGet(`http://127.0.0.1:${port}/json/version`)) return
        await setTimeout(1000)
    }
    throw new Error(`Chrome not ready on port ${port} after ${retries}s`)
}

async function main() {
    console.log("=== Auth Flow E2E (your REAL Chrome) ===\n")

    // Phase 0: Check if Chrome already has CDP running
    const alreadyRunning = await httpGet(`http://127.0.0.1:${CDP_PORT}/json/version`)

    if (!alreadyRunning) {
        const answer = await question(
            "This will KILL all existing Chrome windows and restart with remote debugging.\n" +
            "Save your work in other tabs first. Continue? (y/N): "
        )
        if (answer.toLowerCase() !== "y") {
            console.log("Aborted.")
            process.exit(0)
        }

        console.log("\nKilling Chrome and restarting with remote debugging...")
        try { execSync("taskkill /F /IM chrome.exe /T", { stdio: "pipe" }) } catch { /* ok */ }
        await setTimeout(2000)

        const proc = spawn(CHROME, [
            `--remote-debugging-port=${CDP_PORT}`,
            "--no-first-run",
            "--no-default-browser-check",
        ], { stdio: "ignore", detached: true })
        proc.unref()

        await waitForChrome(CDP_PORT)
        console.log("Chrome ready.\n")
    } else {
        console.log("Chrome already running with CDP. Connecting...\n")
    }

    // Wait 3 min for Vercel build
    console.log("[1/7] Waiting 3 minutes for Vercel build to deploy...")
    console.log("  (Ctrl+C to abort)\n")
    await setTimeout(180000)

    // Connect via CDP
    console.log("[2/7] Connecting to your Chrome...")
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`)
    const ctx = browser.contexts()[0]
    const page = await ctx.newPage()
    console.log("  Connected.\n")

    // Navigate
    console.log("[3/7] Opening gabrieltoth.com/pt-BR ...")
    await page.goto(`${BASE}/pt-BR`, { waitUntil: "networkidle" })

    // Click Entrar
    console.log("[4/7] Clicking 'Entrar'...")
    await page.waitForTimeout(1000)
    await page.click('[data-testid="nav-login"]')
    await page.waitForURL(`${BASE}/pt-BR/signin`, { timeout: 15000 })

    // Click Entrar com Google
    console.log("[5/7] Clicking 'Entrar com Google'...")
    await page.click("button:has-text('Entrar com Google')")
    console.log("  (Google account picker should appear in your Chrome)\n")

    // Wait for redirect back to dashboard
    console.log("  Waiting for Google OAuth redirect...")
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 120000 })
    console.log("  At dashboard!\n")

    // PAUSE for interactive testing
    console.log("[6/7] PAUSED — Dashboard is open.")
    console.log("  Use your Chrome DevTools, inspect, add tests.")
    console.log("  Type 'done' and press Enter when ready to logout.\n")

    await question("  > ")

    // Logout
    console.log("\n[7/7] Clicking 'Sair' (logout)...")
    await page.click("button:has-text('Sair')")
    await page.waitForURL(/\/pt-BR\/(entrar|login)/, { timeout: 15000 })
    console.log("  Logout complete.\n")

    await browser.close()
    console.log("=== Done ===")
}

main().catch((err) => {
    console.error("Error:", err)
    process.exit(1)
})
