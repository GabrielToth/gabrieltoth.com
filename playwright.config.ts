import type { PlaywrightTestConfig } from "@playwright/test"

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`

const config: PlaywrightTestConfig = {
    testDir: "./tests",
    fullyParallel: true,
    workers: process.env.CI ? "100%" : undefined,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],
    expect: {
        timeout: 15000,
    },
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        navigationTimeout: 30000,
        actionTimeout: 15000,
    },
    webServer: {
        command: "npm run dev",
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
    projects: [
        { name: "chromium", use: { browserName: "chromium" } },
        { name: "firefox", use: { browserName: "firefox" } },
        { name: "webkit", use: { browserName: "webkit" } },
    ],
}

export default config
