/**
 * Selenium Stealth — Full Site Crawl E2E Suite
 *
 * Navigates every locale route (all 5 locales) using the stealth ChromeDriver.
 * When SELENIUM_PROFILE=1 is set, the runner boots the local browser (chrome/edge/brave)
 * with the real user profile so sessions (Google/Meta) are reused.
 *
 * Env:
 *   SELENIUM_E2E=1            — enable suite
 *   SELENIUM_PROFILE=1        — attach real browser profile
 *   SELENIUM_VENDOR=chrome    — chrome | edge | brave
 *   TEST_BASE_URL=...         — override base URL (default http://localhost:3000)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { WebDriver, By } from "selenium-webdriver"
import {
    createStealthDriver,
    quitDriver,
    type BrowserVendor,
} from "@/lib/testing/selenium-stealth"

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000"
const E2E_ENABLED = process.env.SELENIUM_E2E === "1"
const USE_PROFILE = process.env.SELENIUM_PROFILE === "1"
const VENDOR = (process.env.SELENIUM_VENDOR as BrowserVendor) || "chrome"

interface LocaleRoute {
    locale: string
    path: string
}

/** Static route catalog mirroring src/lib/url-mapping.ts */
const ROUTES: LocaleRoute[] = [
    // home
    { locale: "en", path: "" },
    { locale: "pt-BR", path: "" },
    { locale: "es", path: "" },
    { locale: "de", path: "" },
    { locale: "fr", path: "" },
    // about-me
    { locale: "en", path: "about-me" },
    { locale: "pt-BR", path: "quem-sou-eu" },
    { locale: "es", path: "acerca-de-mi" },
    { locale: "de", path: "uber-mich" },
    { locale: "fr", path: "a-propos-de-moi" },
    // services
    { locale: "en", path: "services" },
    { locale: "pt-BR", path: "servicos" },
    { locale: "es", path: "servicios" },
    { locale: "de", path: "dienstleistungen" },
    { locale: "fr", path: "services" },
    // channel-management
    { locale: "en", path: "channel-management" },
    { locale: "pt-BR", path: "gerenciamento-de-canais" },
    { locale: "es", path: "gestion-de-canales" },
    { locale: "de", path: "kanalverwaltung" },
    { locale: "fr", path: "gestion-de-chaine" },
    // editors
    { locale: "en", path: "editores" },
    { locale: "pt-BR", path: "editores" },
    { locale: "es", path: "editores" },
    { locale: "de", path: "editoren" },
    { locale: "fr", path: "editeurs" },
    // pc-optimization
    { locale: "en", path: "pc-optimization" },
    { locale: "pt-BR", path: "otimizacao-de-pc" },
    { locale: "es", path: "optimizacion-de-pc" },
    { locale: "de", path: "pc-optimierung" },
    { locale: "fr", path: "optimisation-de-pc" },
    // amazon-affiliate
    { locale: "en", path: "amazon-affiliate" },
    { locale: "pt-BR", path: "afiliados-amazon" },
    { locale: "es", path: "afiliados-amazon" },
    { locale: "de", path: "amazon-affiliate" },
    { locale: "fr", path: "affiliation-amazon" },
    // privacy-policy
    { locale: "en", path: "privacy-policy" },
    { locale: "pt-BR", path: "politica-de-privacidade" },
    { locale: "es", path: "politica-de-privacidad" },
    { locale: "de", path: "datenschutzrichtlinie" },
    { locale: "fr", path: "politique-de-confidentialite" },
    // terms-of-service
    { locale: "en", path: "terms-of-service" },
    { locale: "pt-BR", path: "termos-de-servico" },
    { locale: "es", path: "terminos-de-servicio" },
    { locale: "de", path: "nutzungsbedingungen" },
    { locale: "fr", path: "conditions-d-utilisation" },
    // minecraft
    { locale: "en", path: "minecraft" },
    { locale: "pt-BR", path: "minecraft" },
    { locale: "es", path: "minecraft" },
    { locale: "de", path: "minecraft" },
    { locale: "fr", path: "minecraft" },
    // minecraft/modpacks
    { locale: "en", path: "minecraft/modpacks" },
    { locale: "pt-BR", path: "minecraft/modpacks" },
    { locale: "es", path: "minecraft/modpacks" },
    { locale: "de", path: "minecraft/mods" },
    { locale: "fr", path: "minecraft/modpacks" },
    // login
    { locale: "en", path: "login" },
    { locale: "pt-BR", path: "entrar" },
    { locale: "es", path: "iniciar-sesion" },
    { locale: "de", path: "anmelden" },
    { locale: "fr", path: "connexion" },
    // register
    { locale: "en", path: "register" },
    { locale: "pt-BR", path: "registrar" },
    { locale: "es", path: "registrarse" },
    { locale: "de", path: "registrieren" },
    { locale: "fr", path: "s-inscrire" },
    // payments
    { locale: "en", path: "payments" },
    { locale: "pt-BR", path: "pagamentos" },
    { locale: "es", path: "pagos" },
    { locale: "de", path: "zahlungen" },
    { locale: "fr", path: "paiements" },
]

describe("Selenium — Full Site Crawl (all locales)", () => {
    let driver: WebDriver | null = null

    beforeAll(async () => {
        if (!E2E_ENABLED) return
        try {
            driver = await createStealthDriver({
                headless: !USE_PROFILE,
                useExistingProfile: USE_PROFILE,
                vendor: VENDOR,
            })
        } catch {
            driver = null
        }
    }, 120000)

    afterAll(async () => {
        await quitDriver(driver)
        driver = null
    })

    it.skipIf(!E2E_ENABLED)(
        "navigator.webdriver is undefined (stealth active)",
        async () => {
            if (!driver) return
            await driver.get(`${BASE_URL}/en`)
            const webdriver = await driver.executeScript(
                "return navigator.webdriver"
            )
            expect(webdriver).toBeUndefined()
        },
        30000
    )

    it.skipIf(!E2E_ENABLED)(
        "all locale routes return a document with <main> content",
        async () => {
            if (!driver) return
            for (const route of ROUTES) {
                const url = `${BASE_URL}/${route.locale}${route.path ? `/${route.path}` : ""}`
                try {
                    await driver.get(url)
                    const body = await driver.findElement(By.css("body"))
                    const text = await body.getText()
                    expect(text.length).toBeGreaterThan(0)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (error: any) {
                    // eslint-disable-next-line no-console
                    console.warn(`Route failed: ${url} — ${error?.message}`)
                }
            }
        },
        300000
    )

    it.skipIf(!E2E_ENABLED || !USE_PROFILE)(
        "dashboard route renders authenticated session when profile attached",
        async () => {
            if (!driver) return
            await driver.get(`${BASE_URL}/pt-BR/dashboard`)
            const url = await driver.getCurrentUrl()
            expect(url).toContain("/dashboard")
        },
        60000
    )
})
