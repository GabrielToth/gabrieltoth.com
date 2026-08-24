#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const I18N_DIR = path.resolve(__dirname, "../../src/i18n")
const LOCALES = ["en", "pt-BR", "es", "de", "fr"]

// Common English words that should NOT appear in non-EN locales
const ENGLISH_WORDS = [
    "Sign In",
    "Sign Up",
    "Login",
    "Register",
    "Email",
    "Password",
    "Dashboard",
    "Settings",
    "Profile",
    "Logout",
    "Home",
    "About",
    "Services",
    "Contact",
    "Search",
    "Filter",
    "Sort",
    "Edit",
    "Delete",
    "Cancel",
    "Save",
    "Submit",
    "Continue",
    "Back",
    "Next",
    "Previous",
    "Loading",
    "Success",
    "Error",
    "Warning",
]

// Files that are allowed to have EN content (legal docs requiring professional translation)
const ALLOWED_EN_FILES = [
    "privacyPolicy.json",
    "termsOfService.json",
    "pcOptimizationTerms.json",
]

function getAllFiles(dir, locale) {
    const localeDir = path.join(dir, locale)
    const files = []

    function traverse(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name)
            if (entry.isDirectory()) {
                traverse(fullPath)
            } else if (entry.name.endsWith(".json")) {
                files.push(fullPath)
            }
        }
    }

    traverse(localeDir)
    return files
}

function extractParameters(str) {
    if (typeof str !== "string") return []
    const matches = str.match(/\{[^}]+\}/g)
    return matches ? matches.sort() : []
}

function collectAllParameters(obj, params = new Set()) {
    if (typeof obj === "string") {
        extractParameters(obj).forEach(p => params.add(p))
    } else if (Array.isArray(obj)) {
        obj.forEach(item => collectAllParameters(item, params))
    } else if (typeof obj === "object" && obj !== null) {
        Object.values(obj).forEach(value => collectAllParameters(value, params))
    }
    return params
}

function hasEnglishContent(obj, fileName) {
    // Skip legal docs
    if (ALLOWED_EN_FILES.includes(path.basename(fileName))) {
        return null
    }

    const violations = []

    function check(value, keyPath = "") {
        if (typeof value === "string") {
            for (const word of ENGLISH_WORDS) {
                // Check for exact word match (word boundaries)
                const regex = new RegExp(`\\b${word}\\b`, "i")
                if (regex.test(value)) {
                    violations.push({
                        key: keyPath,
                        value: value.substring(0, 100),
                        word: word,
                    })
                }
            }
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => check(item, `${keyPath}[${index}]`))
        } else if (typeof value === "object" && value !== null) {
            Object.entries(value).forEach(([key, val]) => {
                check(val, keyPath ? `${keyPath}.${key}` : key)
            })
        }
    }

    check(obj)
    return violations.length > 0 ? violations : null
}

console.log(
    "================================================================================"
)
console.log(
    "gabrieltoth.com i18n Parameter Consistency & Translation Coverage Report"
)
console.log(
    "================================================================================\n"
)

let allTestsPassed = true
const results = {}

// Test 1: Parameter Consistency
console.log("📋 Test 1: Parameter Consistency\n")

for (const locale of LOCALES) {
    const files = getAllFiles(I18N_DIR, locale)
    results[locale] = { files: files.length, issues: [] }

    for (const filePath of files) {
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"))
        const params = collectAllParameters(content)

        // Compare with EN version
        if (locale !== "en") {
            const relativePath = filePath.replace(
                path.join(I18N_DIR, locale),
                ""
            )
            const enPath = path.join(I18N_DIR, "en", relativePath)

            if (fs.existsSync(enPath)) {
                const enContent = JSON.parse(fs.readFileSync(enPath, "utf8"))
                const enParams = collectAllParameters(enContent)

                const paramsArray = Array.from(params).sort()
                const enParamsArray = Array.from(enParams).sort()

                if (
                    JSON.stringify(paramsArray) !==
                    JSON.stringify(enParamsArray)
                ) {
                    const missing = enParamsArray.filter(
                        p => !paramsArray.includes(p)
                    )
                    const extra = paramsArray.filter(
                        p => !enParamsArray.includes(p)
                    )

                    results[locale].issues.push({
                        file: path.basename(filePath),
                        type: "parameter-mismatch",
                        missing,
                        extra,
                    })
                    allTestsPassed = false
                }
            }
        }
    }
}

// Test 2: Translation Coverage (non-EN locales should not have English content)
console.log("📋 Test 2: Translation Coverage (English Content Detection)\n")

const translationIssues = {}

for (const locale of LOCALES) {
    if (locale === "en") continue // Skip English

    translationIssues[locale] = []
    const files = getAllFiles(I18N_DIR, locale)

    for (const filePath of files) {
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"))
        const violations = hasEnglishContent(content, filePath)

        if (violations) {
            translationIssues[locale].push({
                file: path.relative(I18N_DIR, filePath),
                violations: violations.slice(0, 5), // Show first 5 violations
            })
            allTestsPassed = false
        }
    }
}

// Print Results
console.log(
    "================================================================================"
)
console.log("RESULTS")
console.log(
    "================================================================================\n"
)

// Parameter Consistency Results
console.log("✅ Parameter Consistency:")
let paramIssues = 0
for (const [locale, data] of Object.entries(results)) {
    if (data.issues.length > 0) {
        console.log(
            `\n❌ ${locale.toUpperCase()}: ${data.issues.length} file(s) with parameter mismatches`
        )
        data.issues.forEach(issue => {
            console.log(`   - ${issue.file}`)
            if (issue.missing.length)
                console.log(`     Missing: ${issue.missing.join(", ")}`)
            if (issue.extra.length)
                console.log(`     Extra: ${issue.extra.join(", ")}`)
        })
        paramIssues += data.issues.length
    } else {
        console.log(
            `   ✓ ${locale.toUpperCase()}: All ${data.files} files consistent`
        )
    }
}

// Translation Coverage Results
console.log("\n✅ Translation Coverage:")
let translationIssuesCount = 0
for (const [locale, issues] of Object.entries(translationIssues)) {
    if (issues.length > 0) {
        console.log(
            `\n❌ ${locale.toUpperCase()}: ${issues.length} file(s) with English content detected`
        )
        issues.forEach(issue => {
            console.log(`   - ${issue.file}`)
            issue.violations.slice(0, 3).forEach(v => {
                console.log(`     • "${v.word}" found in: ${v.key}`)
            })
            if (issue.violations.length > 3) {
                console.log(`     ... and ${issue.violations.length - 3} more`)
            }
        })
        translationIssuesCount += issues.length
    } else {
        console.log(`   ✓ ${locale.toUpperCase()}: No English content detected`)
    }
}

console.log(
    "\n================================================================================"
)

if (allTestsPassed) {
    console.log(
        "[PASS] 100% i18n Parameter Consistency & Translation Coverage Verified!"
    )
    process.exit(0)
} else {
    console.log(`[FAIL] Found issues:`)
    if (paramIssues > 0) {
        console.log(`  - ${paramIssues} parameter consistency issue(s)`)
    }
    if (translationIssuesCount > 0) {
        console.log(
            `  - ${translationIssuesCount} file(s) with English content in non-EN locales`
        )
    }
    console.log("\nPlease fix the issues above before deploying.")
    process.exit(1)
}
