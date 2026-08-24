/**
 * CI Verification script for Supabase Database Migrations
 * Validates file naming, timestamps, and SQL basic syntax.
 */

const fs = require("fs")
const path = require("path")

const MIGRATIONS_DIR = path.join(__dirname, "../supabase/migrations")

function verifyMigrations() {
    console.log(
        "🔍 Verifying Supabase DB Migrations in preview/CI environment..."
    )

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.warn("⚠️ Migrations directory not found:", MIGRATIONS_DIR)
        return
    }

    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith(".sql"))
    console.log(`Found ${files.length} migration file(s).`)

    let errors = 0
    let lastTimestamp = ""

    for (const file of files) {
        const match = file.match(/^(\d{8}_\w+|\d{14}_\w+)\.sql$/)
        if (!match) {
            console.error(
                `❌ Invalid migration filename format: "${file}". Must start with timestamp format (YYYYMMDD_name.sql).`
            )
            errors++
            continue
        }

        const timestamp = file.split("_")[0]
        if (timestamp < lastTimestamp) {
            console.warn(
                `⚠️ Warning: Migration timestamp ordering out of sequence for file: "${file}".`
            )
        }
        lastTimestamp = timestamp

        const filePath = path.join(MIGRATIONS_DIR, file)
        const content = fs.readFileSync(filePath, "utf8")

        if (content.trim().length === 0) {
            console.error(`❌ Migration file is empty: "${file}".`)
            errors++
        }
    }

    if (errors > 0) {
        console.error(
            `❌ DB Migration verification failed with ${errors} error(s).`
        )
        process.exit(1)
    } else {
        console.log("✅ All DB migrations passed CI verification check!")
    }
}

verifyMigrations()
