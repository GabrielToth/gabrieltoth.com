/**
 * publish-meta.js
 *
 * Connects to an existing Chrome (via CDP) that is already logged into
 * Meta Business Suite, then navigates the Meta UI to create the post.
 *
 * This is a DETERMINISTIC script — no AI, no LLM. It follows the same
 * fixed sequence of steps every time. Selectors may need updates when
 * Meta changes their UI.
 *
 * Usage:
 *   node publish-meta.js --task '{"id":"...","taskType":"video",...}' --chrome-port 9222
 */

const { program } = require("commander")

program
    .option("--task <json>", "Task JSON string")
    .option("--task-file <path>", "Path to task JSON file")
    .option("--chrome-port <port>", "Chrome remote debugging port", "9222")
    .option("--chrome-host <host>", "Chrome remote debugging host", "127.0.0.1")
    .parse(process.argv)

const opts = program.opts()

let task
if (opts.task) {
    task = JSON.parse(opts.task)
} else if (opts.taskFile) {
    task = JSON.parse(require("fs").readFileSync(opts.taskFile, "utf-8"))
} else {
    console.error("Either --task or --task-file is required")
    process.exit(1)
}

const CHROME_URL = `http://${opts.chromeHost}:${opts.chromePort}`

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
}

async function waitForSelector(page, selector, timeout = 15000) {
    await page.waitForSelector(selector, { timeout })
}

async function clickAndWait(page, selector, delay = 2000) {
    await waitForSelector(page, selector)
    await page.click(selector)
    await sleep(delay)
}

async function typeText(page, selector, text) {
    await waitForSelector(page, selector)
    await page.click(selector, { clickCount: 3 })
    await page.keyboard.press("Backspace")
    await page.keyboard.type(text, { delay: 30 })
}

async function uploadFile(page, selector, filePath) {
    await waitForSelector(page, selector)
    const input = await page.$(selector)
    await input.uploadFile(filePath)
}

async function navigateToBusinessSuite(page) {
    await page.goto("https://business.facebook.com/", {
        waitUntil: "networkidle2",
        timeout: 30000,
    })
    await sleep(3000)
}

async function publishVideo(page, task) {
    const { payload } = task
    const { title, description, hashtags, scheduleTime } = payload

    await clickAndWait(page, 'a[href*="/media"]', 3000)

    await clickAndWait(page, 'div[aria-label="Create"]', 2000)

    await clickAndWait(page, 'span:has-text("Video")', 2000)

    if (task.video_path) {
        await uploadFile(page, 'input[type="file"]', task.video_path)
        await sleep(5000)
    }

    if (description) {
        await typeText(page, 'div[aria-label*="description" i]', description)
        await sleep(1000)
    }

    if (title) {
        await typeText(page, 'div[aria-label*="title" i]', title)
        await sleep(1000)
    }

    if (hashtags && Array.isArray(hashtags)) {
        const existingText = description || ""
        const tagText = existingText + " " + hashtags.map(h => `#${h}`).join(" ")
        await typeText(page, 'div[aria-label*="description" i]', tagText)
    }

    if (scheduleTime) {
        await clickAndWait(page, 'span:has-text("Schedule")', 1000)
        await sleep(500)
    }

    await clickAndWait(page, 'div[aria-label="Publish"]', 5000)

    let facebookUrl = null
    let instagramUrl = null

    const url = page.url()
    if (url.includes("/facebook.com/")) {
        facebookUrl = url
    }

    return { facebook_url: facebookUrl, instagram_url: instagramUrl }
}

async function publishPost(page, task) {
    const { payload } = task
    const { title, description, hashtags, imagePaths, linkUrl } = payload

    await clickAndWait(page, 'a[href*="/media"]', 3000)
    await clickAndWait(page, 'div[aria-label="Create"]', 2000)
    await clickAndWait(page, 'span:has-text("Post")', 2000)

    if (description) {
        await typeText(page, 'div[role="textbox"][aria-label*="post" i]', description)
    }

    if (imagePaths && Array.isArray(imagePaths)) {
        for (const imgPath of imagePaths) {
            await uploadFile(page, 'input[type="file"]', imgPath)
            await sleep(3000)
        }
    }

    if (hashtags && Array.isArray(hashtags)) {
        const tagText = " " + hashtags.map(h => `#${h}`).join(" ")
        const textbox = await page.$('div[role="textbox"][aria-label*="post" i]')
        if (textbox) {
            await textbox.type(tagText, { delay: 30 })
        }
    }

    await clickAndWait(page, 'div[aria-label="Publish"]', 5000)

    return { facebook_url: page.url() }
}

async function publishStory(page, task) {
    const { payload } = task
    const { description, hashtags } = payload

    await clickAndWait(page, 'a[href*="/stories"]', 3000)

    if (task.video_path) {
        await uploadFile(page, 'input[type="file"]', task.video_path)
        await sleep(5000)
    }

    if (description) {
        await typeText(page, 'div[aria-label*="story" i]', description)
    }

    if (hashtags && Array.isArray(hashtags)) {
        const tagText = " " + hashtags.map(h => `#${h}`).join(" ")
        const textbox = await page.$('div[aria-label*="story" i]')
        if (textbox) {
            await textbox.type(tagText, { delay: 30 })
        }
    }

    await clickAndWait(page, 'div[aria-label="Share"]', 5000)

    return { facebook_url: page.url() }
}

async function main() {
    const puppeteer = require("puppeteer-extra")
    const StealthPlugin = require("puppeteer-extra-plugin-stealth")
    puppeteer.use(StealthPlugin())

    console.log(`Connecting to Chrome at ${CHROME_URL}...`)

    const browser = await puppeteer.connect({
        browserURL: CHROME_URL,
        defaultViewport: null,
    })

    console.log("Connected to Chrome. Opening new page...")

    const page = await browser.newPage()
    page.setDefaultTimeout(30000)

    try {
        await navigateToBusinessSuite(page)

        console.log(`Starting publish task: ${task.id} (${task.taskType})`)

        let result = {}
        switch (task.taskType) {
            case "video":
                result = await publishVideo(page, task)
                break
            case "post":
                result = await publishPost(page, task)
                break
            case "story":
                result = await publishStory(page, task)
                break
            default:
                throw new Error(`Unknown task type: ${task.taskType}`)
        }

        console.log("Publish completed successfully:", JSON.stringify(result))

        await page.close()

        return { success: true, result }
    } catch (error) {
        const screenshotPath = `error-${task.id}.png`
        await page.screenshot({ path: screenshotPath, fullPage: true })
        console.error(`Error screenshot saved to ${screenshotPath}`)

        console.error("Publish failed:", error.message)
        await page.close()

        return { success: false, error: error.message }
    }
}

main()
    .then(output => {
        console.log("---RESULT---")
        console.log(JSON.stringify(output))
        console.log("---END RESULT---")
        process.exit(output.success ? 0 : 1)
    })
    .catch(err => {
        console.error("Fatal error:", err.message)
        process.exit(1)
    })
