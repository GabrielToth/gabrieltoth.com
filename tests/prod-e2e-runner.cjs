/**
 * Production CDP E2E Runner — REAL Chrome, REAL production site
 * ============================================================
 *
 * Connects to YOUR visible Chrome (CDP port 9222, dedicated profile
 * C:\Users\User\.chrome-e2e-profile) and runs a battery of navigation,
 * access-control, and command tests against https://www.gabrieltoth.com.
 *
 * - Headful: the browser window is visible on your screen
 * - Real Chrome 153 binary, no automation flags, navigator.webdriver = false
 * - Sessions persist in the profile, so a manual login survives runs
 *
 * Usage:
 *   node tests/prod-e2e-runner.cjs
 *   BASE_URL=https://www.gabrieltoth.com node tests/prod-e2e-runner.cjs
 */

const { chromium } = require("playwright")

const BASE_URL = process.env.BASE_URL || "https://www.gabrieltoth.com"
const CDP_PORT = process.env.CDP_PORT || "9222"

// ---------------------------------------------------------------- helpers
const results = []
function record(name, ok, extra = "") {
    const ms = new Date().toISOString().slice(11, 23)
    const icon = ok === "PASS" ? "✅" : ok === "FAIL" ? "❌" : "ℹ️"
    console.log(`  [${ms}] ${icon} ${name}${extra ? " — " + extra : ""}`)
    results.push({ name, ok, extra })
}

async function step(browser, name, fn) {
    const ctx = browser.contexts()[0]
    const page = await ctx.newPage()
    try {
        const extra = await fn(page)
        record(name, "PASS", typeof extra === "string" ? extra : "")
    } catch (err) {
        record(name, "FAIL", err.message)
        try {
            await page.screenshot({ path: `tests/prod-e2e-fails/${name.replace(/[^a-z0-9]/gi, "_")}.png` })
        } catch {
            /* ignore */
        }
    } finally {
        try {
            await page.close()
        } catch {
            /* ignore */
        }
    }
}

/** Click the first locator that exists (production build uses different
 *  testids than the latest local code — support both). */
async function clickAny(page, selectors, timeout = 10000) {
    let lastErr = null
    for (const sel of selectors) {
        try {
            await page.locator(sel).first().waitFor({ state: "visible", timeout })
            await page.locator(sel).first().click()
            return sel
        } catch (err) {
            lastErr = err
        }
    }
    throw new Error(
        `none of [${selectors.join(", ")}] found/clickable: ${lastErr ? lastErr.message.split("\n")[0] : ""}`
    )
}

/** goto with production-safe wait (networkidle never settles on pages
 *  with polling — use domcontentloaded + manual settle). */
async function gotoProd(page, url, settleMs = 600) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
    await page.waitForTimeout(settleMs)
}

async function main() {
    console.log("=== PRODUCTION E2E — REAL CHROME via CDP ===")
    console.log(`Target: ${BASE_URL}`)
    console.log(`CDP:    http://127.0.0.1:${CDP_PORT}\n`)

    // Wait for CDP
    const http = require("http")
    const check = () =>
        new Promise(resolve => {
            http.get(`http://127.0.0.1:${CDP_PORT}/json/version`, res =>
                resolve(res.statusCode === 200)
            ).on("error", () => resolve(false))
        })
    for (let i = 0; i < 10; i++) {
        if (await check()) break
        if (i === 9) throw new Error("CDP not reachable on " + CDP_PORT)
        await new Promise(r => setTimeout(r, 1000))
    }

    const browser = await chromium.connectOverCDP(
        `http://127.0.0.1:${CDP_PORT}`
    )
    
    // Capture the real auth cookie so unauthenticated tests can restore it
    const ctx = browser.contexts()[0]
    const realAuthCookie = await browser
        .contexts()[0]
        .cookies(BASE_URL)
        .then(cs => cs.find(c => c.name === 'auth_session'))
console.log("Connected to real Chrome.\n")

    // ------------------------------------------------------------------ 1
    console.log("[1] Home & locales")
    await step(browser, "PT-BR home loads with hero title", async page => {
        await gotoProd(page, `${BASE_URL}/pt-BR`)
        await page.waitForSelector("main", { timeout: 20000 })
        const title = await page.title()
        if (!/gabriel|plataforma|criadores/i.test(title)) throw new Error("title=" + title)
        return title
    })

    await step(browser, "English home loads (/en)", async page => {
        await gotoProd(page, `${BASE_URL}/en`)
        await page.waitForSelector("main", { timeout: 20000 })
        return await page.title()
    })

    await step(browser, "Default root redirects to locale", async page => {
        await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" })
        await page.waitForTimeout(2000)
        const url = page.url()
        if (!/\/(pt-BR|en|es|de|fr)/.test(url))
            throw new Error("no locale prefix: " + url)
        return url
    })

    // ------------------------------------------------------------------ 2
    console.log("[2] Navigation via header")
    await step(browser, "Services dropdown opens and navigates", async page => {
        await gotoProd(page, `${BASE_URL}/en`)
        const btn = await clickAny(page, [
            '[data-testid="services-dropdown-button"]',
            '[data-testid="services-button"]',
        ])
        await page.waitForTimeout(600)
        const link = await clickAny(page, [
            '[data-testid="services-link-mid"]',
            '[data-testid="services-link"]',
            '[data-testid="services-link-channel-management"]',
            'a[href*="servicos"]',
            'a[href*="channel-management"]',
        ], 8000)
        await page.waitForURL(/servicos|services|channel-management/, { timeout: 15000 })
        return btn + " -> " + link + " -> " + page.url()
    })

    await step(browser, "Language selector opens and shows locale options", async page => {
        await gotoProd(page, `${BASE_URL}/en`)
        const sel = await clickAny(page, [
            '[data-testid="language-selector"]',
            '[data-testid="language-selector-button"]',
        ])
        await page.waitForTimeout(800)
        const opts = await page.evaluate(() => ({
            pt: !!document.querySelector('[data-testid="language-selector-option-pt-BR"]'),
            es: !!document.querySelector('[data-testid="language-selector-option-es"]'),
            de: !!document.querySelector('[data-testid="language-selector-option-de"]'),
        }))
        if (!opts.pt && !opts.es && !opts.de)
            throw new Error("no locale options after click: " + JSON.stringify(opts))
        return sel + " options pt=" + opts.pt + " es=" + opts.es + " de=" + opts.de
    })

    await step(browser, "Language selector switches to PT-BR", async page => {
        await gotoProd(page, `${BASE_URL}/en`)
        await page.click('[data-testid="language-selector-button"]')
        await page.click('[data-testid="language-selector-option-pt-BR"]')
        await page.waitForURL(/pt-BR/, { timeout: 15000 })
        return page.url()
    })

    // ------------------------------------------------------------------ 3
    console.log("\n[3] Localized routes (real URL mapping)")
    const localizedRoutes = [
        ["pt-BR", "quem-sou-eu"],
        ["pt-BR", "servicos"],
        ["pt-BR", "gerenciamento-de-canais"],
        ["en", "about-me"],
        ["es", "servicios"],
    ]
    for (const [locale, path] of localizedRoutes) {
        await step(browser, `/${locale}/${path} renders`, async page => {
            const res = await page.goto(`${BASE_URL}/${locale}/${path}`, {
                waitUntil: "domcontentloaded",
                timeout: 30000,
            })
            if (!res || (res.status() !== 200 && res.status() !== 304))
                throw new Error("HTTP " + (res ? res.status() : "?"))
            await page.waitForSelector("main", { timeout: 20000 })
            return "HTTP " + res.status()
        })
    }

    // ------------------------------------------------------------------ 4
    console.log("\n[4] Auth access control")
    // NOTE: profile may be logged in — these steps must simulate signed-out
    // state without destroying the persisted session for other steps.
    await step(browser, "Unauthenticated /dashboard redirects to signin", async page => {
        await ctx.addCookies([{ name: "auth_session", value: "invalid-e2e", url: BASE_URL }])
        await page.goto(`${BASE_URL}/pt-BR/dashboard`, {
            waitUntil: "domcontentloaded",
        })
        await page.waitForTimeout(2500)
        const url = page.url()
        if (realAuthCookie) await ctx.addCookies([realAuthCookie])
        if (!/signin|login/.test(url))
            throw new Error("expected signin redirect, got " + url)
        return url
    })

    await step(browser, "Unauthenticated /dashboard/insights redirects to signin", async page => {
        await ctx.addCookies([{ name: "auth_session", value: "invalid-e2e", url: BASE_URL }])
        await page.goto(`${BASE_URL}/pt-BR/dashboard/insights`, {
            waitUntil: "domcontentloaded",
        })
        await page.waitForTimeout(2500)
        const url = page.url()
        if (!/signin|login/.test(url))
            throw new Error("expected signin redirect, got " + url)
        if (realAuthCookie) await ctx.addCookies([realAuthCookie])
        return url
    })

    await step(browser, "API /api/live/status returns 401 without session", async page => {
        await page.goto(`${BASE_URL}/pt-BR`, { waitUntil: "domcontentloaded" })
        const status = await page.evaluate(async () => {
            const r = await fetch("/api/live/status", { credentials: "omit" })
            return r.status
        })
        if (status !== 401) throw new Error("HTTP " + status)
        return "HTTP 401 ✓"
    })

    await step(browser, "API /api/platform/analytics returns 401 without session", async page => {
        await page.goto(`${BASE_URL}/pt-BR`, { waitUntil: "domcontentloaded" })
        const status = await page.evaluate(async () => {
            const r = await fetch("/api/platform/analytics", { credentials: "omit" })
            return r.status
        })
        if (status !== 401) throw new Error("HTTP " + status)
        return "HTTP 401 ✓"
    })

    // ------------------------------------------------------------------ 5
    console.log("\n[5] Signed-in area (if session exists in profile)")
    await step(browser, "Signed-in dashboard /channels is reachable", async page => {
        // restore the real session (remove the invalid override)
        if (realAuthCookie) await ctx.addCookies([realAuthCookie])
        await page.goto(`${BASE_URL}/pt-BR/dashboard/channels`, {
            waitUntil: "domcontentloaded",
        })
        await page.waitForTimeout(3000)
        const url = page.url()
        if (/signin|login/.test(url))
            throw new Error("redirected to signin — no session in profile")
        await page.waitForSelector("main", { timeout: 15000 })
        return url
    })

    // ------------------------------------------------------------------ 6
    console.log("\n[6] SEO & infra sanity")
    await step(browser, "Sitemap.xml is reachable", async page => {
        const res = await page.goto(`${BASE_URL}/sitemap.xml`, {
            waitUntil: "domcontentloaded",
        })
        const body = await page.content()
        if (!body.includes("<loc>")) throw new Error("empty sitemap")
        const count = (body.match(/<loc>/g) || []).length
        return `${count} URLs`
    })

    await step(browser, "robots.txt allows indexing", async page => {
        const res = await page.goto(`${BASE_URL}/robots.txt`, {
            waitUntil: "domcontentloaded",
        })
        const txt = await page.evaluate(() => document.body.innerText)
        if (/Disallow:\s*\/\s*$/im.test(txt))
            throw new Error("root Disallow found - site blocked")
        if (!/Allow:\s*\/\s*$/im.test(txt))
            throw new Error("missing Allow: / directive")
        return "Allow: / present; no root Disallow"
    })

    // ------------------------------------------------------------------ 7
    console.log("\n[7] Performance snapshot (Lighthouse-style basics)")
    await step(browser, "Home TTFB under threshold", async page => {
        await gotoProd(page, `${BASE_URL}/pt-BR`, 2500)
        const nav = await page.evaluate(() => {
            const [n] = performance.getEntriesByType("navigation")
            return {
                ttfb: n ? n.responseStart : -1,
                domContentLoaded: n ? n.domContentLoadedEventEnd : -1,
            }
        })
        if (nav.ttfb > 2500) throw new Error(`TTFB ${nav.ttfb}ms > 2500ms`)
        return `TTFB ${Math.round(nav.ttfb)}ms, DCL ${Math.round(nav.domContentLoaded)}ms`
    })

    // ---------------------------------------------------------------- done
    const pass = results.filter(r => r.ok === "PASS").length
    const fail = results.filter(r => r.ok === "FAIL").length
    console.log("\n" + "=".repeat(60))
    console.log(`RESULT: ${pass} passed, ${fail} failed, ${results.length} total`)
    console.log("=".repeat(60))
    for (const r of results) {
        console.log(
            `${r.ok === "PASS" ? "✅" : "❌"} ${r.name}${r.extra ? " — " + r.extra : ""}`
        )
    }

    // Persist report
    const fs = require("fs")
    const reportPath = "tests/prod-e2e-report.json"
    fs.writeFileSync(
        reportPath,
        JSON.stringify({ baseUrl: BASE_URL, at: new Date().toISOString(), results }, null, 2)
    )
    console.log(`\nReport saved to ${reportPath}`)
    console.log("Chrome stays open — session persists for the next run.")

    process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => {
    console.error("Fatal:", err.message)
    process.exit(1)
})
