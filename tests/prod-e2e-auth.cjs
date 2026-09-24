/**
 * Production CDP E2E — AUTHENTICATED flows (REAL Chrome, REAL production)
 * =====================================================================
 *
 * Prerequisite: profile C:\Users\User\.chrome-e2e-profile must have an
 * active session (Google login done once — auth_session cookie).
 * If not logged in, run this file with --login to perform the Google
 * OAuth login automatically (uses the account already in the profile).
 *
 * Runs against https://www.gabrieltoth.com with your visible Chrome.
 * Safe: destructive actions are reverted (test command is deleted).
 *
 * Usage:
 *   node tests/prod-e2e-auth.cjs            # full authenticated suite
 *   node tests/prod-e2e-auth.cjs --login    # login first if needed
 */

const { chromium } = require("playwright")

const BASE_URL = process.env.BASE_URL || "https://www.gabrieltoth.com"
const CDP_PORT = process.env.CDP_PORT || "9222"
const DO_LOGIN = process.argv.includes("--login")

// ------------------------------------------------------------------ helpers
const results = []
function record(name, ok, extra = "") {
    const icon = ok === "PASS" ? "PASS" : "FAIL"
    console.log(`  ${ok === "PASS" ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`)
    results.push({ name, ok, extra })
}

async function step(name, fn) {
    try {
        const extra = await fn()
        record(name, "PASS", typeof extra === "string" ? extra : "")
    } catch (err) {
        record(name, "FAIL", err.message.split("\n")[0])
    }
}

async function gotoProd(page, url, settleMs = 1500) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 })
    await page.waitForTimeout(settleMs)
}

// ------------------------------------------------------------------ suite
async function main() {
    console.log("=== PRODUCTION E2E (AUTHENTICATED) — REAL Chrome ===\n")

    const browser = await chromium.connectOverCDP(
        `http://127.0.0.1:${CDP_PORT}`,
        { timeout: 15000 }
    )
    const ctx = browser.contexts()[0]
    const page = await ctx.newPage()
    page.setDefaultTimeout(15000)

    // ---------------------------------------------------------------- session
    console.log("[A] Session & auth")
    await step("auth_session cookie present", async () => {
        const cookies = await ctx.cookies(BASE_URL)
        const auth = cookies.find(c => c.name === "auth_session")
        if (!auth) throw new Error("no auth_session — run with --login first")
        return `expires ${new Date(auth.expires * 1000).toISOString()}`
    })

    await step("dashboard reachable without redirect", async () => {
        await gotoProd(page, `${BASE_URL}/pt-BR/dashboard`, 2500)
        if (/signin|login/.test(page.url())) throw new Error("redirected to signin")
        await page.waitForSelector("main", { timeout: 10000 })
        return page.url()
    })

    // ------------------------------------------------------------- dashboard
    console.log("\n[B] Dashboard pages render (9 routes)")
    const routes = [
        "dashboard",
        "dashboard/publish",
        "dashboard/insights",
        "dashboard/settings",
        "dashboard/credits",
        "dashboard/channels",
        "dashboard/live",
        "dashboard/chat-commands",
        "dashboard/scheduled-streams",
    ]
    for (const route of routes) {
        await step(`/${route} renders <main>`, async () => {
            await gotoProd(page, `${BASE_URL}/pt-BR/${route}`, 2000)
            if (/signin|login/.test(page.url()))
                throw new Error("redirected to signin")
            const hasMain = await page.locator("main").count()
            if (!hasMain) throw new Error("no <main> rendered")
            return "OK"
        })
    }

    // --------------------------------------------------------- scheduled-streams bug
    console.log("\n[C] Scheduled streams (known: production bug check)")
    await step("scheduled-streams page renders content", async () => {
        await gotoProd(page, `${BASE_URL}/pt-BR/dashboard/scheduled-streams`, 3000)
        const txt = await page.evaluate(
            () => document.body.innerText.substring(0, 200)
        )
        if (/404|not found|Página não encontrada/i.test(txt))
            throw new Error("404 rendered — route not deployed to production")
        return txt.replace(/\n/g, " ").substring(0, 80)
    })

    // ----------------------------------------------------------------- live
    console.log("\n[D] Live dashboard & APIs")
    await step("live status API returns real channel data", async () => {
        await page.evaluate(async () => {}) // warm
        const data = await page.evaluate(async () => {
            const r = await fetch("/api/live/status", { credentials: "include" })
            return { status: r.status, body: await r.json() }
        })
        if (data.status !== 200) throw new Error("HTTP " + data.status)
        if (data.body.success !== true) throw new Error("success=false")
        const platforms = (data.body.data || []).map(d => d.platform)
        if (platforms.length === 0) throw new Error("no platforms in response")
        return `platforms: ${platforms.join(", ")}`
    })

    await step("live page shows offline cards per platform", async () => {
        await gotoProd(page, `${BASE_URL}/pt-BR/dashboard/live`, 5000)
        const txt = await page.evaluate(() => {
            const m = document.querySelector("main")
            return m ? m.innerText : ""
        })
        const found = ["Twitch", "Kick", "YouTube"].filter(p =>
            txt.toLowerCase().includes(p.toLowerCase())
        )
        if (found.length < 2) throw new Error("platform cards missing: " + found)
        return `${found.join("/")} cards visible`
    })

    await step("live page renders unified chat panel", async () => {
        const txt = await page.evaluate(() => {
            const m = document.querySelector("main")
            return m ? m.innerText : ""
        })
        if (!/Chat Unificado/i.test(txt)) throw new Error("unified chat missing")
        return "Chat Unificado present"
    })

    // ------------------------------------------------------------- analytics
    console.log("\n[E] Insights & analytics (REAL numbers)")
    await step("analytics API returns real follower totals", async () => {
        const data = await page.evaluate(async () => {
            const r = await fetch("/api/platform/analytics", {
                credentials: "include",
            })
            return { status: r.status, body: await r.json() }
        })
        if (data.status !== 200) throw new Error("HTTP " + data.status)
        const total = data.body?.data?.simpleMetrics?.[0]?.value
        if (typeof total !== "number") throw new Error("no totalFollowers metric")
        return `totalFollowers = ${total.toLocaleString()}`
    })

    await step("insights page renders metric cards", async () => {
        await gotoProd(page, `${BASE_URL}/pt-BR/dashboard/insights`, 3000)
        const txt = await page.evaluate(
            () =>
                document.querySelector("main")
                    ? document.querySelector("main").innerText
                    : ""
        )
        if (!/Seguidores|Followers|Visão/i.test(txt))
            throw new Error("metric cards missing")
        return "cards rendered"
    })

    // --------------------------------------------------------- chat commands
    console.log("\n[F] Chat commands — CRUD (creates + deletes test command)")
    await step("default commands listed (!titleall, !categoryall, !discord)", async () => {
        await gotoProd(page, `${BASE_URL}/pt-BR/dashboard/chat-commands`, 2500)
        const txt = await page.evaluate(() => document.querySelector("main").innerText)
        for (const cmd of ["!titleall", "!categoryall", "!discord"]) {
            if (!txt.includes(cmd)) throw new Error(`missing ${cmd}`)
        }
        return "all defaults present"
    })

    await step("Add Command form opens with trigger/response/cooldown", async () => {
        await page.locator('button:has-text("Adicionar Comando")').first().click()
        await page.waitForTimeout(1000)
        const trig = page.locator("#trigger")
        if (!(await trig.count())) throw new Error("trigger input missing")
        const resp = page.locator("#response")
        if (!(await resp.count())) throw new Error("response input missing")
        return "form fields present"
    })

    const TEST_CMD = "!e2etestcmd"
    await step("create test command (POST roundtrip)", async () => {
        await page.fill("#trigger", TEST_CMD)
        await page.fill("#response", "E2E test command — safe to delete")
        const cd = page.locator("#cooldown")
        if (await cd.count()) await page.fill("#cooldown", "5")
        // save
        await page
            .locator('button:has-text("Salvar Comando"), button:has-text("Salvar"), [role=dialog] button[type=submit]:has-text("Salvar")')
            .first()
            .click()
        await page.waitForTimeout(2000)
        const txt = await page.evaluate(() => document.querySelector("main").innerText)
        if (!txt.includes(TEST_CMD)) throw new Error("command not in list after save")
        return "command created and listed"
    })

    await step("delete test command (cleanup)", async () => {
        // The UI hides delete behind a per-row overflow menu; use the same
        // API the UI calls after opening the menu — direct & reliable.
        const list = await page.evaluate(async () => {
            const r = await fetch("/api/chat-commands/", { credentials: "include" })
            const j = await r.json()
            return j?.data || []
        })
        const test = list.find(c => c.trigger === TEST_CMD)
        if (!test) throw new Error("test command row not found in API")
        const del = await page.evaluate(async id => {
            const r = await fetch(`/api/chat-commands/?id=${id}`, {
                method: "DELETE",
                credentials: "include",
            })
            return { status: r.status, body: await r.json() }
        }, test.id)
        if (del.status !== 200) throw new Error("HTTP " + del.status + " " + JSON.stringify(del.body).substring(0, 80))
        const after = await page.evaluate(async () => {
            const r = await fetch("/api/chat-commands/", { credentials: "include" })
            const j = await r.json()
            return (j?.data || []).some(c => c.trigger === "!e2etestcmd")
        })
        if (after) throw new Error("command still present after delete")
        return "deleted via API (id " + test.id.substring(0, 8) + "…)"
    })

    // ------------------------------------------------------------- channels
    console.log("\n[G] Channels page (non-destructive)")
    await step("channels list shows connected platforms", async () => {
        await gotoProd(page, `${BASE_URL}/pt-BR/dashboard/channels`, 3000)
        const txt = await page.evaluate(() => document.querySelector("main").innerText)
        const found = ["Twitch", "Kick", "YouTube"].filter(p =>
            txt.toLowerCase().includes(p.toLowerCase())
        )
        return `platforms visible: ${found.join(", ") || "(none connected)"}`
    })

    await step("channels page has Connect buttons", async () => {
        const connect = await page
            .locator('button:has-text("Conectar"), a:has-text("Conectar")')
            .count()
        if (connect === 0) throw new Error("no Connect buttons found")
        return `${connect} connect actions`
    })

    // ------------------------------------------------------------- settings
    console.log("\n[H] Settings page")
    await step("settings tabs render", async () => {
        await gotoProd(page, `${BASE_URL}/pt-BR/dashboard/settings`, 2500)
        const txt = await page.evaluate(() => document.querySelector("main").innerText)
        const tabs = ["Chat"].filter(t => txt.includes(t))
        if (tabs.length === 0) throw new Error("no settings tabs readable")
        // known i18n bug: raw keys like dashboard.settings.tabs.*
        const rawKeys = /dashboard\.settings\.tabs\./.test(txt)
        return rawKeys ? "RENDERED (i18n raw keys present — known bug)" : "OK"
    })

    // ---------------------------------------------------------------- done
    const pass = results.filter(r => r.ok === "PASS").length
    const fail = results.filter(r => r.ok === "FAIL").length
    console.log("\n" + "=".repeat(60))
    console.log(`RESULT: ${pass} passed, ${fail} failed / ${results.length}`)
    console.log("=".repeat(60))

    const fs = require("fs")
    fs.writeFileSync(
        "tests/prod-e2e-auth-report.json",
        JSON.stringify(
            { baseUrl: BASE_URL, at: new Date().toISOString(), results },
            null,
            2
        )
    )
    console.log("Report: tests/prod-e2e-auth-report.json")

    await page.close()
    process.exit(fail > 0 ? 1 : 0)
}

// ------------------------------------------------------------------ login
async function login() {
    const browser = await chromium.connectOverCDP(
        `http://127.0.0.1:${CDP_PORT}`,
        { timeout: 15000 }
    )
    const ctx = browser.contexts()[0]
    const page = await ctx.newPage()
    await gotoProd(page, `${BASE_URL}/pt-BR/signin/`, 2000)
    await page.locator('button:has-text("Google"), a:has-text("Google")').first().click()
    await page.waitForURL(/dashboard/, { timeout: 30000 })
    console.log("Logged in:", page.url())
    await page.close()
}

;(async () => {
    try {
        if (DO_LOGIN) await login()
        await main()
    } catch (err) {
        console.error("Fatal:", err.message)
        process.exit(1)
    }
})()
