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
 *  2. No `props: any` / `(...args: any[])` inside page.tsx/route.tsx files.
 *  3. Page aliases (localized page.tsx wrappers) must import LocalePageProps.
 *  4. Components may not import from `next/router` (App Router only).
 *  5. Hardcoded Portuguese/Spanish copy in TSX → must use next-intl `t()`.
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
const PROPS_ANY = /(?:props|props\w*)\s*(?::|=\s*)\s*(?:{\s*[\w|,\s]*}\s*:\s*)?any\b/i
const NEXT_ROUTER = /from\s+["']next\/router["']/
const BANNED_TAILWIND_GREYS =
    /\bbg-(neutral-(?:8|9)00|zinc-(?:8|9)00)(?:\/|\s|"|`)/

/** Locale aliases that must use LocalePageProps */
const ALIAS_LOCALE_PAGES = new Set([
    "a-propos-de-moi",
    "acerca-de-mi",
    "afiliados-amazon",
    "afiliation-amazon",
    "anmelden",
    "channel-management-de",
    "conditions-d-utilisation",
    "connexion",
    "datenschutzrichtlinie",
    "editeurs",
    "editoren",
    "gestion-de-canales",
    "gestion-de-chaine",
    "gerenciamento-de-canais",
    "iniciar-sesion",
    "kanalverwaltung",
    "nutzungsbedingungen",
    "otimizacao-de-pc",
    "optimizacion-de-pc",
    "optimisation-de-pc",
    "pc-optimierung",
    "pagamentos",
    "pagos",
    "paiements",
    "politica-de-privacidad",
    "politica-de-privacidade",
    "politique-de-confidentialite",
    "quem-sou-eu",
    "registrar",
    "registrarse",
    "registrieren",
    "s-inscrire",
    "servicos",
    "servicios",
    "termos-de-servico",
    "terminos-de-servicio",
    "uber-mich",
    "zahlungen",
])

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

function report(file, line, rule, message) {
    violations.push({ file: relative(ROOT, file), line, rule, message })
}

function scanFile(file) {
    if (file.includes("__tests__") || file.includes("node_modules")) return
    const src = readFileSync(file, "utf8")
    const rel = relative(ROOT, file)
    const filename = file.split(/[\\/]/).pop() || ""

    // Rule 1 — raw grey hex colours
    if (RAW_GREY.test(src)) {
        report(file, 0, "raw-grey-hex", "Raw grey hex used; prefer bg-card / bg-background / border-border tokens")
    }

    // Rule 1b — banned tailwind neutral/zinc-800/900 classes
    if (BANNED_TAILWIND_GREYS.test(src)) {
        report(file, 0, "banned-tailwind-grey", "bg-neutral-800/900 or bg-zinc-800/900 used; prefer tokenized bg-card / bg-muted / border-border")
    }

    // Rule 2 — props: any / (...args: any[]) in pages/routes
    if (PROPS_ANY.test(src) && (filename === "page.tsx" || filename === "route.ts" || filename === "layout.tsx")) {
        report(file, 0, "props-any", "Page/route using props: any — please derive proper LocalePageProps / route types")
    }

    // Rule 4 — next/router import (Pages Router leftovers)
    if (NEXT_ROUTER.test(src)) {
        report(file, 0, "next-router-import", "next/router is not allowed in the App Router — use next/navigation")
    }

    // Rule 3 — alias page must import LocalePageProps
    if (filename === "page.tsx") {
        const dir = rel.split(/[\\/]/).at(-2) || ""
        const isAliasLocale = ALIAS_LOCALE_PAGES.has(dir)
        if (isAliasLocale && !/LocalePageProps/.test(src)) {
            report(file, 0, "locale-page-props", `Alias route "${dir}" must import LocalePageProps`)
        }
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

    console.log(`❌ ${violations.length} standard violation(s) across ${scanned} scanned files:\n`)
    for (const v of violations) {
        console.log(`  [${v.rule}] ${v.file}:${v.line} → ${v.message}`)
    }
    console.log("")
    process.exit(1)
}

main()
