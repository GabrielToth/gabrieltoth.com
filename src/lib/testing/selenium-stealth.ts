/**
 * Selenium Stealth Driver Factory
 *
 * Creates ChromeDriver instances with experimental stealth flags that prevent
 * the browser from exposing automation fingerprints (navigator.webdriver,
 * Blink features, CDP runtime, etc.) so E2E tests behave like genuine user
 * sessions and are not flagged as "test/automation mode" by target sites.
 *
 * Supports loading an existing user profile (Brave / Chrome / Edge) so the
 * suite can reuse real logged-in sessions (Google OAuth, Meta cookies) without
 * triggering fresh login flows or captcha challenges.
 *
 * Flags follow the undetected-chromedriver / puppeteer-extra-stealth pattern.
 *
 * Validates: ROADMAP Phase 2 — Twitter/X & Instagram stealth automation.
 */

import { Builder, WebDriver, Capabilities } from "selenium-webdriver"
import chrome from "selenium-webdriver/chrome"
import * as os from "os"
import * as path from "path"
import * as fs from "fs"

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

/** Known local Chromium-family browser install locations (Windows) */
export type BrowserVendor = "chrome" | "edge" | "brave"

export interface StealthDriverOptions {
    headless?: boolean
    userAgent?: string
    /** Use the real browser profile (session cookies preserved) */
    useExistingProfile?: boolean
    /** Which local browser to launch: 'chrome' | 'edge' | 'brave' */
    vendor?: BrowserVendor
    /** Custom user profile data dir (overrides vendor defaults) */
    userDataDir?: string
    /** Profile name inside userDataDir (Default, Profile 1, ...) */
    profileDirectory?: string
}

function getVendorBinaryPath(vendor: BrowserVendor): string | null {
    const programFiles = process.env["ProgramFiles"] || "C:\\Program Files"
    const programFilesX86 =
        process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)"
    const localAppData =
        process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local")

    const candidates: Record<BrowserVendor, string[]> = {
        chrome: [
            path.join(
                programFiles,
                "Google",
                "Chrome",
                "Application",
                "chrome.exe"
            ),
            path.join(
                programFilesX86,
                "Google",
                "Chrome",
                "Application",
                "chrome.exe"
            ),
            path.join(
                localAppData,
                "Google",
                "Chrome",
                "Application",
                "chrome.exe"
            ),
        ],
        edge: [
            path.join(
                programFiles,
                "Microsoft",
                "Edge",
                "Application",
                "msedge.exe"
            ),
            path.join(
                programFilesX86,
                "Microsoft",
                "Edge",
                "Application",
                "msedge.exe"
            ),
        ],
        brave: [
            path.join(
                programFiles,
                "BraveSoftware",
                "Brave-Browser",
                "Application",
                "brave.exe"
            ),
            path.join(
                programFilesX86,
                "BraveSoftware",
                "Brave-Browser",
                "Application",
                "brave.exe"
            ),
            path.join(
                localAppData,
                "BraveSoftware",
                "Brave-Browser",
                "Application",
                "brave.exe"
            ),
        ],
    }

    for (const candidate of candidates[vendor] ?? []) {
        if (fs.existsSync(candidate)) return candidate
    }
    return null
}

function getVendorUserDataDir(vendor: BrowserVendor): string | null {
    const localAppData =
        process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local")
    const dirs: Record<BrowserVendor, string> = {
        chrome: path.join(localAppData, "Google", "Chrome", "User Data"),
        edge: path.join(localAppData, "Microsoft", "Edge", "User Data"),
        brave: path.join(
            localAppData,
            "BraveSoftware",
            "Brave-Browser",
            "User Data"
        ),
    }
    return dirs[vendor] ?? null
}

/** Build a stealth-capable Selenium Chrome WebDriver */
export async function createStealthDriver(
    options: StealthDriverOptions = {}
): Promise<WebDriver> {
    const {
        headless = true,
        userAgent,
        useExistingProfile = false,
        vendor = "chrome",
        userDataDir,
        profileDirectory,
    } = options

    const chromeOptions = new chrome.Options()
    chromeOptions.set("excludeSwitches", [
        "enable-automation",
        "enable-logging",
    ])
    chromeOptions.set("useAutomationExtension", false)
    chromeOptions.set("detach", true)

    // Resolve vendor binary if running a local browser (not bundled chromedriver default)
    if (useExistingProfile || vendor !== "chrome") {
        const binary = getVendorBinaryPath(vendor)
        if (binary) chromeOptions.setBinaryPath(binary)
    }

    for (const arg of STEALTH_ARGS) {
        chromeOptions.addArguments(arg)
    }
    if (headless) {
        chromeOptions.addArguments("--headless=new")
    }
    if (userAgent) {
        chromeOptions.addArguments(`--user-agent=${userAgent}`)
    }

    // Attach real user profile when requested (keeps logged-in sessions)
    if (useExistingProfile) {
        const dataDir = userDataDir ?? getVendorUserDataDir(vendor)
        if (dataDir) {
            chromeOptions.addArguments(`--user-data-dir=${dataDir}`)
            chromeOptions.addArguments(
                `--profile-directory=${profileDirectory ?? "Default"}`
            )
        }
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
        await (driver as any)
            .executeCdpCommand("Page.addScriptToEvaluateOnNewDocument", {
                source: STEALTH_CDP_SCRIPT,
            })
            .catch(() => {
                /* CDP unavailable in some drivers — degrade gracefully */
            })
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

/** Detect which local Chromium browsers are installed */
export function detectInstalledBrowsers(): BrowserVendor[] {
    const vendors: BrowserVendor[] = ["chrome", "edge", "brave"]
    return vendors.filter(v => getVendorBinaryPath(v) !== null)
}
