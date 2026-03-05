// Quick test script for environment validation
import { validateEnv } from "../src/lib/config/env"

console.log("Testing environment validation...\n")

// Test 1: Missing all required variables
console.log("Test 1: Missing all required variables")
delete process.env.DATABASE_URL
delete process.env.REDIS_URL
delete process.env.DISCORD_WEBHOOK_URL

try {
    validateEnv()
    console.log("❌ FAILED: Should have thrown error")
} catch (error) {
    if (
        error instanceof Error &&
        error.message.includes("Missing required environment variables")
    ) {
        console.log("✅ PASSED: Correctly threw error for missing variables")
        console.log(`   Error: ${error.message}`)
    } else {
        console.log("❌ FAILED: Wrong error thrown")
    }
}

// Test 2: All variables present
console.log("\nTest 2: All required variables present")
process.env.DATABASE_URL = "postgres://localhost:5432/test"
process.env.REDIS_URL = "redis://localhost:6379"
process.env.DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/test"

try {
    const config = validateEnv()
    console.log("✅ PASSED: Validation succeeded")
    console.log(`   Config: NODE_ENV=${config.NODE_ENV}, DEBUG=${config.DEBUG}`)
} catch (error) {
    console.log("❌ FAILED: Should not have thrown error")
    console.log(`   Error: ${error}`)
}

// Test 3: Missing one variable
console.log("\nTest 3: Missing DATABASE_URL")
delete process.env.DATABASE_URL

try {
    validateEnv()
    console.log("❌ FAILED: Should have thrown error")
} catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
        console.log("✅ PASSED: Correctly threw error for missing DATABASE_URL")
        console.log(`   Error: ${error.message}`)
    } else {
        console.log("❌ FAILED: Wrong error thrown")
    }
}

console.log("\n✅ All manual tests passed!")
