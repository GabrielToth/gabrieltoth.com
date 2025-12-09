// JS version (no ts-node). See README in header of the TS version for setup.
const fs = require("fs")
const path = require("path")
const { google } = require("googleapis")

const PROPERTY = "sc-domain:www.gabrieltoth.com"
const SERVICE_ACCOUNT_PATH = path.join(
    process.cwd(),
    ".secrets",
    "gcp-service-account.json"
)
const OUTPUT_DIR = path.join(process.cwd(), ".auth", "extracted")

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

async function getAuthClient() {
    let rawJson = fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8")
    // Remove BOM if present
    if (rawJson.charCodeAt(0) === 0xfeff) {
        rawJson = rawJson.slice(1)
    }
    const key = JSON.parse(rawJson)
    const scopes = [
        "https://www.googleapis.com/auth/webmasters",
        "https://www.googleapis.com/auth/webmasters.readonly",
    ]
    const jwt = new google.auth.JWT(
        key.client_email,
        undefined,
        key.private_key,
        scopes
    )
    await jwt.authorize()
    return jwt
}

async function fetchSearchAnalytics(auth) {
    try {
        const webmasters = google.webmasters({ version: "v3", auth })
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 28)
        const request = {
            siteUrl: PROPERTY,
            requestBody: {
                startDate: start.toISOString().slice(0, 10),
                endDate: end.toISOString().slice(0, 10),
                dimensions: ["page"],
                rowLimit: 5000,
            },
        }
        const res = await webmasters.searchanalytics.query(request)
        return res.data
    } catch (e) {
        console.warn("[GSC API] Search Analytics failed:", e.message)
        return { rows: [] }
    }
}

async function fetchTopQueries(auth) {
    try {
        const webmasters = google.webmasters({ version: "v3", auth })
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 28)
        const request = {
            siteUrl: PROPERTY,
            requestBody: {
                startDate: start.toISOString().slice(0, 10),
                endDate: end.toISOString().slice(0, 10),
                dimensions: ["query"],
                rowLimit: 1000,
            },
        }
        const res = await webmasters.searchanalytics.query(request)
        return res.data
    } catch (e) {
        console.warn("[GSC API] Top Queries failed:", e.message)
        return { rows: [] }
    }
}

async function run() {
    ensureDir(OUTPUT_DIR)
    try {
        let auth
        try {
            auth = await getAuthClient()
        } catch (authErr) {
            console.warn(
                "[GSC API] Auth failed:",
                authErr.message,
                "\nTo collect GSC data, set .secrets/gcp-service-account.json with valid Service Account credentials."
            )
            auth = null
        }

        let pages = { rows: [] }
        let queries = { rows: [] }

        if (auth) {
            pages = await fetchSearchAnalytics(auth)
            queries = await fetchTopQueries(auth)
        }

        const outPath = path.join(OUTPUT_DIR, "gsc-api.json")
        fs.writeFileSync(
            outPath,
            JSON.stringify(
                {
                    timestamp: new Date().toISOString(),
                    authenticated: auth !== null,
                    pages,
                    queries,
                },
                null,
                2
            )
        )
        console.log("[GSC API] Wrote", outPath)
    } catch (e) {
        console.error("[GSC API] Fatal error:", e.message)
        process.exit(1)
    }
}

run()
