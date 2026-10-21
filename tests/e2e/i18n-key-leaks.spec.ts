import { expect, test } from "@playwright/test"

/**
 * Raw i18n key leak detection across locales.
 *
 * A missing translation renders the raw key (e.g. "dashboard.settings.tabs")
 * as visible text. This suite visits every public page in every locale and
 * asserts no raw keys leak into the DOM.
 */

const LOCALES = ["pt-BR", "en", "es", "de", "fr"]

// All locale-prefixed public routes (dashboard pages require auth — covered
// separately; unauthenticated visits redirect to login so they can't leak
// dashboard keys, but the landing page of each route is checked).
const PUBLIC_ROUTES = [
    "",
    "/home",
    "/about-me",
    "/channel-management",
    "/editors",
    "/minecraft",
    "/minecraft/modpacks",
    "/minecraft/mods",
    "/minecraft/plugins",
    "/pc-optimization",
    "/privacy-policy",
    "/terms-of-service",
    "/login",
    "/signup",
]

// Known i18n namespace roots — a visible token matching "ns.key" is a leak
const NS_ROOTS = [
    "home",
    "about",
    "contact",
    "dashboard",
    "publish",
    "layout",
    "landing",
    "features",
    "pricing",
    "plugins",
    "contributions",
    "hero",
    "editors",
    "minecraftPageHero",
    "servicesPageHero",
]

test.describe("i18n raw key leak detection", () => {
    for (const locale of LOCALES) {
        test(`no raw i18n keys visible — ${locale}`, async ({ page }) => {
            const leaks: string[] = []

            for (const route of PUBLIC_ROUTES) {
                const url = `${locale}${route}`
                try {
                    const resp = await page.goto(url, {
                        waitUntil: "domcontentloaded",
                    })
                    if (!resp || resp.status() >= 400) continue // skip 404/redirects

                    const body = await page.textContent("body")
                    if (!body) continue

                    // any visible "ns.something" token from our namespaces
                    for (const ns of NS_ROOTS) {
                        const re = new RegExp(
                            `\\b${ns}\\.[a-zA-Z][a-zA-Z0-9.]*`
                        )
                        const m = body.match(re)
                        if (m) leaks.push(`${url}: "${m[0]}"`)
                    }
                } catch {
                    // network/redirect failures are out of scope here
                }
            }

            expect(leaks, `Raw keys leaked: ${leaks.join(", ")}`).toHaveLength(
                0
            )
        })
    }
})

test.describe("i18n key coverage (source scanner parity)", () => {
    test("scanner reports zero missing keys", async () => {
        // The scanner runs in CI; this test asserts its exit status here so
        // E2E and static coverage stay in lockstep.
        const { execSync } = await import("child_process")
        const out = execSync("node scripts/i18n-key-scanner.cjs", {
            encoding: "utf8",
        })
        expect(out).toContain("0 keys missing")
    })
})
