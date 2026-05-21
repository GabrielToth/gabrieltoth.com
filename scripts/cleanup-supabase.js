#!/usr/bin/env node

/**
 * Script: Cleanup Supabase Database
 *
 * Purpose: Delete all users, authentication records, and reset database for fresh deployment
 * Usage: node scripts/cleanup-supabase.js --confirm
 *
 * ⚠️ WARNING: This is DESTRUCTIVE! All user data will be permanently deleted.
 * Only use in development or before fresh deployments.
 */

const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

// Load environment variables from .env.local
function loadEnvFile(filePath) {
    const envPath = path.join(process.cwd(), filePath)
    if (!fs.existsSync(envPath)) {
        console.warn(`⚠️ ${filePath} not found`)
        return {}
    }

    const envContent = fs.readFileSync(envPath, "utf-8")
    const env = {}

    envContent.split("\n").forEach(line => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) return

        const match = trimmed.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1]
            let value = match[2]

            // Remove quotes if present
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1)
            }

            env[key] = value
        }
    })

    return env
}

const envLocal = loadEnvFile(".env.local")
const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    envLocal.NEXT_PUBLIC_SUPABASE_URL ||
    ""
const SUPABASE_SERVICE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    envLocal.SUPABASE_SERVICE_ROLE_KEY ||
    ""

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error(
        "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    )
    console.error(
        `NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? "✅ loaded" : "❌ missing"}`
    )
    console.error(
        `SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_KEY ? "✅ loaded" : "❌ missing"}`
    )
    process.exit(1)
}

console.log("✅ Environment variables loaded")
console.log(`   SUPABASE_URL: ${SUPABASE_URL.substring(0, 30)}...`)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function cleanupDatabase() {
    console.log("\n🔄 Starting Supabase database cleanup...\n")

    try {
        // Step 1: Delete all rate limit records
        console.log("📋 Step 1: Deleting rate limit records...")
        const { error: rateLimitError, count: rateLimitCount } = await supabase
            .from("rate_limit_records")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")
            .select("id", { count: "exact" })

        if (rateLimitError) {
            console.warn(
                `⚠️ Rate limit records deletion skipped (table may not exist): ${rateLimitError.message}`
            )
        } else {
            console.log(
                `✅ Deleted ${rateLimitCount || 0} rate limit records\n`
            )
        }

        // Step 2: Delete all audit logs
        console.log("📋 Step 2: Deleting audit logs...")
        const { error: auditError, count: auditCount } = await supabase
            .from("audit_logs")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")
            .select("id", { count: "exact" })

        if (auditError) {
            console.warn(
                `⚠️ Audit logs deletion skipped (table may not exist): ${auditError.message}`
            )
        } else {
            console.log(`✅ Deleted ${auditCount || 0} audit logs\n`)
        }

        // Step 3: Delete all users (from public.users if it exists)
        console.log("📋 Step 3: Deleting all users...")
        const { error: usersError, count: usersCount } = await supabase
            .from("users")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")
            .select("id", { count: "exact" })

        if (usersError) {
            console.warn(
                `⚠️ Users deletion skipped (table may not exist): ${usersError.message}`
            )
        } else {
            console.log(`✅ Deleted ${usersCount || 0} users\n`)
        }

        // Step 4: Verify database is empty
        console.log("📋 Step 4: Verifying cleanup...")

        let usersVerify = null
        let rateLimitVerify = null
        let auditVerify = null

        try {
            const usersRes = await supabase
                .from("users")
                .select("id", { count: "exact", head: true })
            usersVerify = usersRes.count
        } catch (e) {
            console.log("   - Users table: not accessible")
        }

        try {
            const rateLimitRes = await supabase
                .from("rate_limit_records")
                .select("id", { count: "exact", head: true })
            rateLimitVerify = rateLimitRes.count
        } catch (e) {
            console.log("   - Rate limit records table: not accessible")
        }

        try {
            const auditRes = await supabase
                .from("audit_logs")
                .select("id", { count: "exact", head: true })
            auditVerify = auditRes.count
        } catch (e) {
            console.log("   - Audit logs table: not accessible")
        }

        console.log("\n✅ Verification complete:")
        console.log(
            `   - Users remaining: ${usersVerify !== null ? usersVerify : "N/A (table may not exist)"}`
        )
        console.log(
            `   - Rate limit records remaining: ${rateLimitVerify !== null ? rateLimitVerify : "N/A (table may not exist)"}`
        )
        console.log(
            `   - Audit logs remaining: ${auditVerify !== null ? auditVerify : "N/A (table may not exist)"}`
        )

        const allClean =
            (usersVerify === null || usersVerify === 0) &&
            (rateLimitVerify === null || rateLimitVerify === 0) &&
            (auditVerify === null || auditVerify === 0)

        if (allClean) {
            console.log(
                "\n✨ Database cleanup successful! All user data has been removed."
            )
            return true
        } else {
            console.error("\n❌ Cleanup incomplete. Some records remain.")
            return false
        }
    } catch (error) {
        console.error("❌ Cleanup failed:", error)
        process.exit(1)
    }
}

// Main execution with confirmation
async function main() {
    const isProduction = process.env.NODE_ENV === "production"

    if (isProduction) {
        console.log("⚠️  PRODUCTION MODE DETECTED!")
        console.log(
            "🛑 Refusing to cleanup production database as a safety measure."
        )
        console.log(
            "   If you need to cleanup production, set NODE_ENV=development first.\n"
        )
        process.exit(1)
    }

    console.log("⚠️  WARNING: This will PERMANENTLY DELETE all user data!")
    console.log("   This action cannot be undone.\n")

    // In automated scripts, require explicit confirmation
    const args = process.argv.slice(2)
    if (!args.includes("--confirm")) {
        console.log("❌ Cleanup requires --confirm flag")
        console.log("   Usage: node scripts/cleanup-supabase.js --confirm\n")
        process.exit(1)
    }

    const success = await cleanupDatabase()
    process.exit(success ? 0 : 1)
}

main()
