#!/usr/bin/env node

/**
 * Script: Cleanup Supabase Database
 *
 * Purpose: Delete all users, authentication records, and reset database for fresh deployment
 * Usage: npx ts-node scripts/cleanup-supabase.ts
 *
 * ⚠️ WARNING: This is DESTRUCTIVE! All user data will be permanently deleted.
 * Only use in development or before fresh deployments.
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error(
        "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    )
     
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function cleanupDatabase() {
    console.log("🔄 Starting Supabase database cleanup...\n")

    try {
        // Step 1: Delete all rate limit records
        console.log("📋 Step 1: Deleting rate limit records...")
        const { error: rateLimitError, count: rateLimitCount } = await supabase
            .from("rate_limit_records")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all
            .select("id", { count: "exact" } as any)

        if (rateLimitError) {
            console.warn(
                `⚠️ Rate limit records deletion skipped: ${rateLimitError.message}`
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
            .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all
            .select("id", { count: "exact" } as any)

        if (auditError) {
            console.warn(
                `⚠️ Audit logs deletion skipped: ${auditError.message}`
            )
        } else {
            console.log(`✅ Deleted ${auditCount || 0} audit logs\n`)
        }

        // Step 3: Delete all users
        console.log("📋 Step 3: Deleting all users...")
        const { error: usersError, count: usersCount } = await supabase
            .from("users")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all
            .select("id", { count: "exact" } as any)

        if (usersError) {
            console.warn(`⚠️ Users deletion skipped: ${usersError.message}`)
        } else {
            console.log(`✅ Deleted ${usersCount || 0} users\n`)
        }

        // Step 4: Verify database is empty
        console.log("📋 Step 4: Verifying cleanup...")

        const { count: usersVerify } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true } as any)

        const { count: rateLimitVerify } = await supabase
            .from("rate_limit_records")
            .select("id", { count: "exact", head: true } as any)

        const { count: auditVerify } = await supabase
            .from("audit_logs")
            .select("id", { count: "exact", head: true } as any)

        console.log("✅ Verification complete:")
        console.log(`   - Users remaining: ${usersVerify || 0}`)
        console.log(
            `   - Rate limit records remaining: ${rateLimitVerify || 0}`
        )
        console.log(`   - Audit logs remaining: ${auditVerify || 0}`)

        if (
            (usersVerify || 0) === 0 &&
            (rateLimitVerify || 0) === 0 &&
            (auditVerify || 0) === 0
        ) {
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
        console.log(
            "   Usage: npx ts-node scripts/cleanup-supabase.ts --confirm\n"
        )
         
        process.exit(1)
    }

    const success = await cleanupDatabase()
     
    process.exit(success ? 0 : 1)
}

main().catch(error => {
    console.error("Fatal error:", error)
     
    process.exit(1)
})
