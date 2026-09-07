#!/usr/bin/env node
/**
 * Component Standards Linter
 *
 * Enforces the gabrieltoth.com component design-system rules on every
 * UI/page source file. Fails with exit code 1 when any rule is violated.
 *
 * Rules:
 *  1. No raw hex greys (#0a0a0a, #111, #141414, #171717, #242424) inside
 *     pages/components — use bg-card / bg-background / border-border tokens.
 *  2. No `bg-{neutral|zinc|stone|slate|gray}-{800|900|950}` background
 *     classes — use tokenized bg-card / bg-background / bg-muted instead.
 *  3. No `props: any` inside page.tsx/route.tsx files.
 *  4. Components may not import from `next/router` (App Router only).
 *
 * Run: node scripts/check-component-standards.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import process from "node:process"

const ROOT = process.cwd()
const SRC = join(ROOT, "src")
const violations = []
let scanned = 0

const RAW_GREY = /#(0a0a0a|111|141414|171717|242424|262626|333333)\b/i
const PROPS_ANY =
    /(?:props|props\w*)\s*(?::|=\s*)\s*(?:{\s*[\w|,\s]*}\s*:\s*)?any\b/i
const NEXT_ROUTER = /from\s+["']next\/router["']/

/**
 * Only flag *background* classes (bg-*) in the darkest shades (800/900/950).
 * Lighter greys (text-neutral-400, border-neutral-700) are acceptable
 * supporting tones and are NOT violations of the card/background token rule.
 */
const BANNED_BG_GREYS =
    /bg-(neutral|zinc|stone|slate|gray)-(?:800|900|950)(?:\/|[\s"`])/

/** Recursively collect source files. */
function walk(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry.startsWith(".")) continue
        const full = join(dir, entry)
        const stat = statSync(full)
        if (stat.isDirectory()) walk(full, out)
        else if (/\.(tsx?|mts|cts|js|jsx)$/.test(entry)) out.push(full)
    }
    return out
}

function report(file, rule, message) {
    violations.push({ file: relative(ROOT, file), rule, message })
}

function scanFile(file) {
    if (file.includes("__tests__") || file.includes("node_modules")) return
    const src = readFileSync(file, "utf8")
    const rel = relative(ROOT, file)
    const filename = file.split(/[\\/]/).pop() || ""

    // Rule 1 — raw grey hex colours
    if (RAW_GREY.test(src)) {
        report(
            file,
            "raw-grey-hex",
            "Raw grey hex used; prefer bg-card / bg-background / border-border tokens"
        )
    }

    // Rule 2 — banned dark grey *background* classes
    if (BANNED_BG_GREYS.test(src)) {
        report(
            file,
            "banned-bg-grey",
            "Dark bg-neutral/zinc/stone/slate/gray-800/900/950 used; prefer tokenized bg-card / bg-background / bg-muted"
        )
    }

    // Rule 3 — props: any in pages/routes
    if (
        PROPS_ANY.test(src) &&
        (filename === "page.tsx" ||
            filename === "route.ts" ||
            filename === "layout.tsx")
    ) {
        report(
            file,
            "props-any",
            "Page/route using props: any — derive proper LocalePageProps / route types"
        )
    }

    // Rule 4 — next/router import (Pages Router leftovers)
    if (NEXT_ROUTER.test(src)) {
        report(
            file,
            "next-router-import",
            "next/router is not allowed in the App Router — use next/navigation"
        )
    }
}

function main() {
    console.log("\n📐 Component Standards Lint")
    console.log("───────────────────────────\n")

    const files = walk(SRC)
    for (const file of files) {
        scanned++
        scanFile(file)
    }

    if (violations.length === 0) {
        console.log(`✅ All ${scanned} source files pass component standards.`)
        process.exit(0)
    }

    console.log(
        `❌ ${violations.length} standard violation(s) across ${scanned} scanned files:\n`
    )
    for (const v of violations) {
        console.log(`  [${v.rule}] ${v.file} → ${v.message}`)
    }
    console.log("")
    process.exit(1)
}

main()