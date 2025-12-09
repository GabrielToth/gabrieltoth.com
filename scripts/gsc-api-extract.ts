/*
    Extract GSC Search Analytics and URL Inspection via Google APIs (no browser login).
    Prereqs:
    1) Create a Google Cloud Project and enable: Search Console API + URL Inspection API.
    2) Create a Service Account, download the JSON to .secrets/gcp-service-account.json (gitignored).
    3) In GSC, add the Service Account email as a full user of the property https://www.gabrieltoth.com/.
*/
import fs from "fs"
import { google } from "googleapis"
import path from "path"

const PROPERTY = "sc-domain:www.gabrieltoth.com"
const SERVICE_ACCOUNT_PATH = path.join(
    process.cwd(),
    ".secrets",
    "gcp-service-account.json"
)
const OUTPUT_DIR = path.join(process.cwd(), ".auth", "extracted")

function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

async function getAuthClient() {
    const key = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"))
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

async function fetchSearchAnalytics(auth: any) {
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
}

async function fetchTopQueries(auth: any) {
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
}

async function run() {
    ensureDir(OUTPUT_DIR)
    const auth = await getAuthClient()
    const pages = await fetchSearchAnalytics(auth)
    const queries = await fetchTopQueries(auth)
    const outPath = path.join(OUTPUT_DIR, "gsc-api.json")
    fs.writeFileSync(
        outPath,
        JSON.stringify(
            { timestamp: new Date().toISOString(), pages, queries },
            null,
            2
        )
    )
    console.log("[GSC API] Wrote", outPath)
}

run().catch(e => {
    console.error("[GSC API] Error:", e.message)
    process.exit(1)
})
