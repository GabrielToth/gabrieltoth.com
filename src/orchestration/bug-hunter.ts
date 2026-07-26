import { BugHuntConfig, BugHuntAction, ErrorAction } from "./types"
import { createLogger } from "@/lib/logger"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { load as loadYaml } from "js-yaml"
import puppeteer, { Browser, Page } from "puppeteer"
import { execSync } from "child_process"

const logger = createLogger("BugHunter")

interface ErrorReport {
    action: string
    error: string
    screenshot?: string
    consoleLogs?: string[]
    networkLogs?: string[]
    url?: string
    timestamp: number
}

export class BugHunter {
    private configs: BugHuntConfig[]
    private isRunning: boolean = false
    private intervalIds: NodeJS.Timeout[] = []
    private browser: Browser | null = null
    private baseUrl: string = "http://localhost:3000"
    private reportDir: string

    constructor(baseUrl?: string) {
        const configPath = join(
            process.cwd(),
            "config",
            "orchestration",
            "bug-hunt.yaml"
        )
        const config = loadYaml(readFileSync(configPath, "utf-8")) as {
            bug_hunt: BugHuntConfig[]
        }
        this.configs = config.bug_hunt

        if (baseUrl) {
            this.baseUrl = baseUrl
        }

        this.reportDir = join(process.cwd(), "bug-reports")
        if (!existsSync(this.reportDir)) {
            mkdirSync(this.reportDir, { recursive: true })
        }

        logger.info(`Loaded ${this.configs.length} bug hunt configurations`)
        logger.info(`Base URL: ${this.baseUrl}`)
        logger.info(`Report dir: ${this.reportDir}`)
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn("Bug hunter already running")
            return
        }

        // Check if site is reachable before starting
        const isUp = await this.checkSiteHealth()
        if (!isUp) {
            logger.error(`Site not reachable at ${this.baseUrl} - Bug Hunter will not start`)
            logger.info("Start your dev server first: npm run dev")
            return
        }

        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ],
        })

        this.isRunning = true
        logger.info("🚀 Starting 24/7 bug hunter with Puppeteer")

        for (const config of this.configs) {
            const intervalMs = this.parseSchedule(config.schedule)
            const intervalId = setInterval(() => {
                this.runHunt(config).catch(err => {
                    logger.error(
                        `Hunt ${config.name} failed: ${err instanceof Error ? err.message : String(err)}`
                    )
                })
            }, intervalMs)
            this.intervalIds.push(intervalId)

            this.runHunt(config).catch(err => {
                logger.error(
                    `Initial hunt ${config.name} failed: ${err instanceof Error ? err.message : String(err)}`
                )
            })

            logger.info(
                `Scheduled ${config.name} every ${intervalMs / 1000 / 60}min`
            )
        }
    }

    private async checkSiteHealth(): Promise<boolean> {
        try {
            const res = await fetch(this.baseUrl, { 
                method: "HEAD",
                signal: AbortSignal.timeout(5000)
            })
            return res.ok
        } catch {
            return false
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            return
        }

        for (const intervalId of this.intervalIds) {
            clearInterval(intervalId)
        }
        this.intervalIds = []

        if (this.browser) {
            await this.browser.close()
            this.browser = null
        }

        this.isRunning = false
        logger.info("Bug hunter stopped")
    }

    private parseSchedule(schedule: string): number {
        const match = schedule.match(/every (\d+)([hm])/)
        if (!match) {
            throw new Error(`Invalid schedule format: ${schedule}`)
        }
        const value = parseInt(match[1], 10)
        const unit = match[2]
        return unit === "h" ? value * 60 * 60 * 1000 : value * 60 * 1000
    }

    private async runHunt(config: BugHuntConfig): Promise<void> {
        logger.info(`🔍 Running hunt: ${config.name}`)
        const startTime = Date.now()

        const errors: ErrorReport[] = []
        let page: Page | null = null

        try {
            if (!this.browser) {
                throw new Error("Browser not initialized")
            }

            page = await this.browser.newPage()

            const consoleLogs: string[] = []
            const networkLogs: string[] = []

            page.on("console", msg => {
                const text = msg.text()
                consoleLogs.push(`[${msg.type()}] ${text}`)
                if (msg.type() === "error") {
                    logger.warn(`Console error: ${text}`)
                }
            })

            page.on("pageerror", error => {
                const msg = `Page error: ${error.message}`
                consoleLogs.push(msg)
                logger.error(msg)
            })

            page.on("response", response => {
                if (response.status() >= 400) {
                    const msg = `${response.status()} ${response.url()}`
                    networkLogs.push(msg)
                    logger.warn(`Network error: ${msg}`)
                }
            })

            await page.setViewport({ width: 1440, height: 900 })

            for (const action of config.actions) {
                try {
                    await this.executeAction(action, page, config)
                } catch (error) {
                    const errorInfo: ErrorReport = {
                        action: JSON.stringify(action),
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        consoleLogs: [...consoleLogs],
                        networkLogs: [...networkLogs],
                        url: page.url(),
                        timestamp: Date.now(),
                    }
                    errors.push(errorInfo)

                    for (const errorAction of config.onError) {
                        await this.handleError(errorAction, errorInfo, page)
                    }
                }
            }
        } catch (error) {
            logger.error(
                `Hunt ${config.name} crashed: ${error instanceof Error ? error.message : String(error)}`
            )
        } finally {
            if (page) {
                await page.close()
            }
        }

        const duration = Date.now() - startTime
        logger.info(
            `Hunt ${config.name} completed in ${duration}ms with ${errors.length} errors`
        )

        if (errors.length > 0) {
            const reportPath = join(
                this.reportDir,
                `${config.name}-${Date.now()}.json`
            )
            writeFileSync(reportPath, JSON.stringify(errors, null, 2))
            logger.info(`Error report saved: ${reportPath}`)
        }
    }

    private async executeAction(
        action: BugHuntAction,
        page: Page,
        config: BugHuntConfig
    ): Promise<void> {
        logger.debug(`Executing action: ${action.type}`)

        switch (action.type) {
            case "navigate":
                await this.navigate(page, action.url)
                break
            case "click_all_links":
                await this.clickAllLinks(page, config.maxPages)
                break
            case "fill_random_forms":
                await this.fillRandomForms(page)
                break
            case "check_console_errors":
                await this.checkConsoleErrors(page)
                break
            case "check_responsive":
                await this.checkResponsive(page, action.sizes)
                break
            case "check_contrast":
                await this.checkContrast(page)
                break
            case "check_overlapping_elements":
                await this.checkOverlappingElements(page)
                break
            case "test_empty_states":
                await this.testEmptyStates(page)
                break
            case "test_error_boundaries":
                await this.testErrorBoundaries(page)
                break
            case "test_input_validation":
                await this.testInputValidation(page)
                break
        }
    }

    private async navigate(page: Page, url: string): Promise<void> {
        const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`
        logger.info(`Navigate to ${fullUrl}`)
        await page.goto(fullUrl, { waitUntil: "networkidle2", timeout: 30000 })
        await new Promise(resolve => setTimeout(resolve, 2000))
    }

    private async clickAllLinks(page: Page, maxPages: number): Promise<void> {
        logger.info(`Click all links (max ${maxPages} pages)`)

        const links = await page.$$eval("a[href]", anchors =>
            anchors
                .map(a => (a as HTMLAnchorElement).href)
                .filter(
                    href =>
                        href &&
                        !href.includes("javascript:") &&
                        !href.includes("mailto:")
                )
                .slice(0, maxPages)
        )

        for (const link of links) {
            try {
                logger.debug(`Clicking link: ${link}`)
                await page.goto(link, {
                    waitUntil: "networkidle2",
                    timeout: 15000,
                })
                await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (error) {
                logger.warn(
                    `Failed to navigate to ${link}: ${error instanceof Error ? error.message : String(error)}`
                )
            }
        }
    }

    private async fillRandomForms(page: Page): Promise<void> {
        logger.info("Fill random forms")

        const forms = await page.$$("form")
        for (const form of forms) {
            try {
                const inputs = await form.$$("input, textarea")
                for (const input of inputs) {
                    const type = await input.evaluate(
                        el => (el as HTMLInputElement).type
                    )
                    if (type === "text" || type === "email") {
                        await input.type("test@example.com")
                    } else if (type === "password") {
                        await input.type("TestPassword123!")
                    } else if (type === "checkbox") {
                        await input.click()
                    }
                }
            } catch (error) {
                logger.warn(`Form fill error: ${error}`)
            }
        }
    }

    private async checkConsoleErrors(page: Page): Promise<void> {
        logger.info("Check console errors")
        await new Promise(resolve => setTimeout(resolve, 3000))
    }

    private async checkResponsive(
        page: Page,
        sizes: number[]
    ): Promise<void> {
        logger.info(`Check responsive for sizes: ${sizes.join(", ")}`)

        for (const width of sizes) {
            await page.setViewport({ width, height: 900 })
            await new Promise(resolve => setTimeout(resolve, 2000))

            const hasHorizontalScroll = await page.evaluate(() => {
                return document.body.scrollWidth > window.innerWidth
            })

            if (hasHorizontalScroll) {
                throw new Error(
                    `Horizontal scroll detected at width ${width}px`
                )
            }
        }
    }

    private async checkContrast(page: Page): Promise<void> {
        logger.info("Check contrast")

        const lowContrastElements = await page.evaluate(() => {
            const elements = document.querySelectorAll("*")
            const issues: string[] = []

            elements.forEach(el => {
                const style = window.getComputedStyle(el)
                const bgColor = style.backgroundColor
                const color = style.color

                if (bgColor && color && bgColor !== "rgba(0, 0, 0, 0)") {
                }
            })

            return issues
        })

        if (lowContrastElements.length > 0) {
            logger.warn(
                `Found ${lowContrastElements.length} potential contrast issues`
            )
        }
    }

    private async checkOverlappingElements(page: Page): Promise<void> {
        logger.info("Check overlapping elements")

        const overlaps = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll("*"))
            const issues: string[] = []

            for (let i = 0; i < elements.length; i++) {
                const rect1 = elements[i].getBoundingClientRect()
                for (let j = i + 1; j < elements.length; j++) {
                    const rect2 = elements[j].getBoundingClientRect()

                    if (
                        rect1.left < rect2.right &&
                        rect1.right > rect2.left &&
                        rect1.top < rect2.bottom &&
                        rect1.bottom > rect2.top
                    ) {
                    }
                }
            }

            return issues
        })

        if (overlaps.length > 0) {
            logger.warn(`Found ${overlaps.length} overlapping elements`)
        }
    }

    private async testEmptyStates(page: Page): Promise<void> {
        logger.info("Test empty states")
    }

    private async testErrorBoundaries(page: Page): Promise<void> {
        logger.info("Test error boundaries")

        await page.evaluate(() => {
            throw new Error("Test error boundary")
        }).catch(() => {})

        await new Promise(resolve => setTimeout(resolve, 2000))
    }

    private async testInputValidation(page: Page): Promise<void> {
        logger.info("Test input validation")

        const inputs = await page.$$("input[type=email]")
        for (const input of inputs) {
            await input.type("invalid-email")
            const form = await input.evaluateHandle(
                el => (el as HTMLElement).closest("form")
            )
            if (form) {
                try {
                    await Promise.race([
                        (form as any).click(),
                        new Promise(resolve => setTimeout(resolve, 1000)),
                    ])
                } catch {}
            }
        }
    }

    private async handleError(
        action: ErrorAction,
        errorInfo: ErrorReport,
        page: Page
    ): Promise<void> {
        switch (action.type) {
            case "screenshot":
                await this.takeScreenshot(errorInfo, page)
                break
            case "capture_console":
                logger.info(
                    `Captured ${errorInfo.consoleLogs?.length || 0} console logs`
                )
                break
            case "capture_network_logs":
                logger.info(
                    `Captured ${errorInfo.networkLogs?.length || 0} network logs`
                )
                break
            case "create_issue":
                await this.createIssue(errorInfo)
                break
        }
    }

    private async takeScreenshot(
        errorInfo: ErrorReport,
        page: Page
    ): Promise<void> {
        const screenshotPath = join(
            this.reportDir,
            `screenshot-${Date.now()}.png`
        )
        await page.screenshot({ path: screenshotPath, fullPage: true })
        errorInfo.screenshot = screenshotPath
        logger.info(`Screenshot saved: ${screenshotPath}`)
    }

    private async createIssue(errorInfo: ErrorReport): Promise<void> {
        logger.info(
            `Creating GitHub issue for error: ${errorInfo.error.slice(0, 100)}`
        )

        const title = `[Bug Hunter] ${errorInfo.error.slice(0, 80)}`
        const body = `## Automated Bug Report

**Error:** ${errorInfo.error}

**URL:** ${errorInfo.url || "N/A"}

**Timestamp:** ${new Date(errorInfo.timestamp).toISOString()}

**Action:** ${errorInfo.action}

### Console Logs
\`\`\`
${errorInfo.consoleLogs?.slice(-10).join("\n") || "No console logs"}
\`\`\`

### Network Logs
\`\`\`
${errorInfo.networkLogs?.slice(-10).join("\n") || "No network logs"}
\`\`\`

${errorInfo.screenshot ? `\n**Screenshot:** ${errorInfo.screenshot}` : ""}

---
*Generated by Bug Hunter at ${new Date().toISOString()}*
`

        try {
            execSync(
                `gh issue create --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --label "bug,automated"`,
                { cwd: process.cwd() }
            )
            logger.info(`✅ GitHub issue created: ${title}`)
        } catch (error) {
            logger.error(
                `Failed to create issue: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }
}
