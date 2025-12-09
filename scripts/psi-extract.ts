/*
    Extract Core Web Vitals via PageSpeed Insights API (no login).
    Prereqs:
    - Create an API key at https://console.cloud.google.com/apis/credentials
    - Save it in .secrets/psi-key.txt (gitignored)
*/
import fs from "fs"
import fetch from "node-fetch"
import path from "path"

const URL = "https://www.gabrieltoth.com/"
const PSI_KEY_PATH = path.join(process.cwd(), ".secrets", "psi-key.txt")
const OUTPUT_DIR = path.join(process.cwd(), ".auth", "extracted")

function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

async function runOnce(strategy: "mobile" | "desktop") {
    const key = fs.readFileSync(PSI_KEY_PATH, "utf-8").trim()
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(URL)}&category=performance&strategy=${strategy}&key=${key}`
    const res = await fetch(endpoint)
    if (!res.ok) throw new Error(`PSI ${strategy} failed: ${res.status}`)
    const data = await res.json()
    return data
}

async function run() {
    ensureDir(OUTPUT_DIR)
    const mobile = await runOnce("mobile")
    const desktop = await runOnce("desktop")
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
}

run().catch(e => {
    console.error("[PSI] Error:", e.message)
    process.exit(1)
})
