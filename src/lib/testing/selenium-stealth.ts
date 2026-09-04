/**
 * Selenium Stealth Driver Factory
 *
 * Creates ChromeDriver instances with experimental stealth flags that prevent
 * the browser from exposing automation fingerprints (navigator.webdriver,
 * Blink features, CDP runtime, etc.) so E2E tests behave like genuine user
 * sessions and are not flagged as "test/automation mode" by target sites.
 *
 * Flags follow the undetected-chromedriver / puppeteer-extra-stealth pattern.
 *
 * Validates: ROADMAP Phase 2 — Twitter/X & Instagram stealth automation.
 */

import { Builder, WebDriver, Capabilities } from "selenium-webdriver"
import chrome from "selenium-webdriver/chrome"

/** Stealth Chrome arguments (experimental flags to avoid automation flags) */
const STEALTH_ARGS: readonly string[] = [
    // Core stealth
    "--disable-blink-features=AutomationControlled",
    "--excludeSwitches=enable-automation",
    "--disable-automation",
    "--disable-infobars",
    // Fingerprint mitigation
    "--disable-features=AutomationControlled",
    "--lang=pt-BR",
    // Networking / sandbox tolerance on CI
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1280,900",
] as const

/** CDP stealth script injected before page scripts execute */
const STEALTH_CDP_SCRIPT = `
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en'] });
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
window.chrome = { runtime: {} };
const originalQuery = window.navigator.permissions && window.navigator.permissions.query;
if (originalQuery) {
  window.navigator.permissions.query = (parameters) =>
    parameters.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : originalQuery(parameters);
}
`

export interface StealthDriverOptions {
    headless?: boolean
    userAgent?: string
}

/** Build a stealth-capable Selenium Chrome WebDriver */
export async function createStealthDriver(
    options: StealthDriverOptions = {}
): Promise<WebDriver> {
    const { headless = true, userAgent } = options

    const chromeOptions = new chrome.Options()
    chromeOptions.set("excludeSwitches", [
        "enable-automation",
        "enable-logging",
    ])
    chromeOptions.set("useAutomationExtension", false)
    chromeOptions.set("detach", true)

    for (const arg of STEALTH_ARGS) {
        chromeOptions.addArguments(arg)
    }
    if (headless) {
        chromeOptions.addArguments("--headless=new")
    }
    if (userAgent) {
        chromeOptions.addArguments(`--user-agent=${userAgent}`)
    }

    chromeOptions.setPageLoadStrategy("normal")

    const capabilities = Capabilities.chrome()
    capabilities.set("goog:chromeOptions", chromeOptions)

    const driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(chromeOptions)
        .build()

    await driver.manage().setTimeouts({ implicit: 8000, pageLoad: 30000 })

    await injectStealth(driver)
    return driver
}

/** Inject the CDP stealth preload script into all future documents */
export async function injectStealth(driver: WebDriver): Promise<void> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = await (driver as any).getSession()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (driver as any)
            .executeCdpCommand("Page.addScriptToEvaluateOnNewDocument", {
                source: STEALTH_CDP_SCRIPT,
            })
            .catch(() => {
                /* CDP unavailable in some drivers — degrade gracefully */
            })
        void session
    } catch {
        // CDP unavailable — tests still run; silent fallback
    }
}

/** Safely quit a driver, swallowing already-terminated errors */
export async function quitDriver(driver: WebDriver | null): Promise<void> {
    if (!driver) return
    try {
        await driver.quit()
    } catch {
        /* already closed */
    }
}
