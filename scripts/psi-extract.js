// JS version using node-fetch
const fs = require("fs")
const path = require("path")
const fetch = require("node-fetch")

const URL = "https://www.gabrieltoth.com/"
const PSI_KEY_PATH = path.join(process.cwd(), ".secrets", "psi-key.txt")
const OUTPUT_DIR = path.join(process.cwd(), ".auth", "extracted")

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

async function runOnce(strategy, attempt = 1) {
    const maxAttempts = 3
    const hasKey = fs.existsSync(PSI_KEY_PATH)
    const key = hasKey ? fs.readFileSync(PSI_KEY_PATH, "utf-8").trim() : ""
    const isPlaceholder = key.includes("PLACEHOLDER")

    const keyParam =
        hasKey && key && !isPlaceholder ? `&key=${encodeURIComponent(key)}` : ""
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(URL)}&category=performance&strategy=${strategy}${keyParam}`

    try {
        const res = await fetch(endpoint)

        if (res.status === 429 && attempt < maxAttempts) {
            console.warn(
                `[PSI] ${strategy} rate limited (429), retrying attempt ${attempt + 1}/${maxAttempts}...`
            )
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
            return runOnce(strategy, attempt + 1)
        }

        if (res.status === 400 || res.status === 403) {
            if (isPlaceholder) {
                console.warn(
                    `[PSI] ${strategy}: Invalid or placeholder API key (HTTP ${res.status}). To collect real CWV data, set .secrets/psi-key.txt with a valid Google Cloud API key.`
                )
            } else {
                console.error(`[PSI] ${strategy} failed: HTTP ${res.status}`)
            }
            return {
                error: `HTTP ${res.status}`,
                strategy,
                note: "Invalid or missing API key",
            }
        }

        if (!res.ok) throw new Error(`PSI ${strategy} failed: ${res.status}`)
        const data = await res.json()
        return data
    } catch (e) {
        console.error(`[PSI] ${strategy} error:`, e.message)
        return { error: e.message, strategy }
    }
}

;(async () => {
    try {
        ensureDir(OUTPUT_DIR)
        console.log("[PSI] Collecting mobile and desktop metrics...")
        const [mobile, desktop] = await Promise.all([
            runOnce("mobile"),
            runOnce("desktop"),
        ])
        const outPath = path.join(OUTPUT_DIR, "psi.json")
        fs.writeFileSync(
            outPath,
            JSON.stringify(
                { timestamp: new Date().toISOString(), mobile, desktop },
                null,
                2
            )
        )
        console.log("[PSI] Wrote", outPath)
        process.exit(0)
    } catch (e) {
        console.error("[PSI] Error:", e.message)
        process.exit(1)
    }
})()
