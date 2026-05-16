#!/usr/bin/env node

/**
 * Generate Production Secrets for Vercel
 *
 * This script generates secure random values needed for Vercel environment variables.
 * Run: node scripts/generate-secrets.mjs
 *
 * Output can be copied directly to Vercel Settings > Environment Variables
 */

import crypto from "crypto"

console.log("\n" + "=".repeat(80))
console.log("VERCEL ENVIRONMENT VARIABLES - SECRET GENERATION")
console.log("=".repeat(80) + "\n")

// Generate PEPPER_SECRET
const pepperSecret = crypto.randomBytes(32).toString("hex")

console.log("1. PEPPER_SECRET (Secure Random 32 bytes)")
console.log("-".repeat(80))
console.log(`Value: ${pepperSecret}`)
console.log(`Length: ${pepperSecret.length} characters`)
console.log(`Mark as: ✅ SENSITIVE`)
console.log()

// Generate JWT secret for OAuth
const jwtSecret = crypto.randomBytes(64).toString("hex")

console.log("2. JWT_SECRET (For OAuth Registration)")
console.log("-".repeat(80))
console.log(`Value: ${jwtSecret}`)
console.log(`Length: ${jwtSecret.length} characters`)
console.log(`Mark as: ✅ SENSITIVE`)
console.log()

// Generate token encryption key
const tokenEncryptionKey = crypto.randomBytes(32).toString("hex")

console.log("3. TOKEN_ENCRYPTION_KEY (For OAuth Token Storage)")
console.log("-".repeat(80))
console.log(`Value: ${tokenEncryptionKey}`)
console.log(`Length: ${tokenEncryptionKey.length} characters`)
console.log(`Mark as: ✅ SENSITIVE`)
console.log()

// Display Argon2id parameters
console.log("4. ARGON2ID PARAMETERS (Identical to Docker)")
console.log("-".repeat(80))
console.log("ARGON2_MEMORY_COST=64 (Mark as: ❌ NOT SENSITIVE)")
console.log("ARGON2_TIME_COST=3 (Mark as: ❌ NOT SENSITIVE)")
console.log("ARGON2_PARALLELISM=2 (Mark as: ❌ NOT SENSITIVE)")
console.log()

// Display Rate Limiting parameters
console.log("5. RATE LIMITING PARAMETERS (Identical to Docker)")
console.log("-".repeat(80))
console.log("RATE_LIMIT_FAILURE_THRESHOLD=5 (Mark as: ❌ NOT SENSITIVE)")
console.log("RATE_LIMIT_WINDOW_MINUTES=15 (Mark as: ❌ NOT SENSITIVE)")
console.log("RATE_LIMIT_LOCKOUT_MINUTES=15 (Mark as: ❌ NOT SENSITIVE)")
console.log(
    "RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD=3 (Mark as: ❌ NOT SENSITIVE)"
)
console.log()

// Display CAPTCHA setup
console.log("6. CAPTCHA CONFIGURATION")
console.log("-".repeat(80))
console.log("CAPTCHA_PROVIDER=cloudflare (Mark as: ❌ NOT SENSITIVE)")
console.log(
    "CAPTCHA_SECRET_KEY=<Get from Cloudflare Dashboard> (Mark as: ✅ SENSITIVE)"
)
console.log(
    "NEXT_PUBLIC_CAPTCHA_SITE_KEY=<Get from Cloudflare Dashboard> (Mark as: ❌ NOT SENSITIVE)"
)
console.log()
console.log("How to get Cloudflare Turnstile keys:")
console.log("1. Go to: https://dash.cloudflare.com/")
console.log('2. Navigate to "Turnstile" in left sidebar')
console.log("3. Find gabrieltoth.com domain")
console.log("4. Copy Site Key → NEXT_PUBLIC_CAPTCHA_SITE_KEY")
console.log("5. Copy Secret Key → CAPTCHA_SECRET_KEY")
console.log()

// Summary table
console.log("SUMMARY - Vercel Environment Variables to Set")
console.log("-".repeat(80))
console.log()
console.log("SENSITIVE VARIABLES (Mark ✅ Sensitive in Vercel Dashboard):")
console.log()
console.log(`PEPPER_SECRET = ${pepperSecret}`)
console.log(`JWT_SECRET = ${jwtSecret}`)
console.log(`TOKEN_ENCRYPTION_KEY = ${tokenEncryptionKey}`)
console.log(`CAPTCHA_SECRET_KEY = <FROM CLOUDFLARE>`)
console.log()
console.log("NON-SENSITIVE VARIABLES (Mark ❌ NOT Sensitive):")
console.log()
console.log("ARGON2_MEMORY_COST = 64")
console.log("ARGON2_TIME_COST = 3")
console.log("ARGON2_PARALLELISM = 2")
console.log("RATE_LIMIT_FAILURE_THRESHOLD = 5")
console.log("RATE_LIMIT_WINDOW_MINUTES = 15")
console.log("RATE_LIMIT_LOCKOUT_MINUTES = 15")
console.log("RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD = 3")
console.log("CAPTCHA_PROVIDER = cloudflare")
console.log("NEXT_PUBLIC_CAPTCHA_SITE_KEY = <FROM CLOUDFLARE>")
console.log()

console.log("STEP-BY-STEP SETUP:")
console.log("-".repeat(80))
console.log("1. Copy each SENSITIVE variable value above")
console.log("2. Go to https://vercel.com/dashboard")
console.log("3. Select gabrieltoth.com project")
console.log("4. Click Settings > Environment Variables")
console.log('5. Click "Add Environment Variable"')
console.log("6. Enter Variable Name and Value")
console.log('7. Select "Production" and "Preview" environments')
console.log('8. Check "Sensitive" checkbox for secret variables')
console.log('9. Click "Save"')
console.log("10. Repeat for each variable")
console.log("11. Redeploy to apply changes")
console.log()

console.log("VERIFICATION:")
console.log("-".repeat(80))
console.log(
    "After setting variables, check Vercel Settings > Environment Variables"
)
console.log("to confirm all values are present and marked correctly.")
console.log()

console.log("SECURITY NOTES:")
console.log("-".repeat(80))
console.log(
    "⚠️ PEPPER_SECRET: Never share, never commit to git, store securely"
)
console.log("⚠️ JWT_SECRET: New per environment, never share")
console.log("⚠️ TOKEN_ENCRYPTION_KEY: New per environment, never share")
console.log("⚠️ CAPTCHA_SECRET_KEY: Keep secure, regenerate if compromised")
console.log()

console.log("=".repeat(80))
console.log("For detailed setup instructions, see: .agent/VERCEL_ENV_SETUP.md")
console.log("=".repeat(80) + "\n")
