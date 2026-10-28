#!/usr/bin/env node
/**
 * add-i18n-keys.js — Merge translation keys across ALL locales atomically.
 *
 * Usage:
 *   node scripts/add-i18n-keys.js <spec.json>
 *
 * Spec format (nested under namespace file names, e.g. dashboard.json):
 * {
 *   "dashboard.json": {
 *     "cloner.title": {
 *       "pt-BR": "Clonador do YouTube",
 *       "en": "YouTube Cloner",
 *       "es": "Clonador de YouTube",
 *       "de": "YouTube-Kloner",
 *       "fr": "Cloneur YouTube"
 *     }
 *   }
 * }
 *
 * Existing keys are left untouched unless { overwrite: true } is given at the
 * top level of the spec. Missing intermediate objects are created. The script
 * fails loudly when any locale value is missing for a key.
 */
const fs = require("fs")
const path = require("path")

const LOCALES = ["pt-BR", "en", "es", "de", "fr"]
const I18N_DIR = path.join(__dirname, "../src/i18n")

const specPath = process.argv[2]
if (!specPath) {
    console.error("Usage: node scripts/add-i18n-keys.js <spec.json>")
    process.exit(1)
}

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"))
const overwrite = spec.__overwrite === true
delete spec.__overwrite

function setPath(obj, keyPath, value) {
    const parts = keyPath.split(".")
    let cur = obj
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (typeof cur[part] !== "object" || cur[part] === null) {
            cur[part] = {}
        }
        cur = cur[part]
    }
    const leaf = parts[parts.length - 1]
    if (leaf in cur && !overwrite) {
        return false
    }
    cur[leaf] = value
    return true
}

let added = 0
let skipped = 0
const errors = []

for (const [fileName, entries] of Object.entries(spec)) {
    for (const [keyPath, values] of Object.entries(entries)) {
        for (const locale of LOCALES) {
            if (typeof values[locale] !== "string") {
                errors.push(
                    `Missing ${locale} value for ${fileName}::${keyPath}`
                )
            }
        }
        if (errors.length > 0) continue

        for (const locale of LOCALES) {
            const filePath = path.join(I18N_DIR, locale, fileName)
            if (!fs.existsSync(filePath)) {
                errors.push(`Locale file not found: ${filePath}`)
                continue
            }
            const json = JSON.parse(fs.readFileSync(filePath, "utf8"))
            const didAdd = setPath(json, keyPath, values[locale])
            if (didAdd) {
                fs.writeFileSync(
                    filePath,
                    JSON.stringify(json, null, 4) + "\n",
                    "utf8"
                )
                added++
            } else {
                skipped++
            }
        }
    }
}

console.log(`Added: ${added} | Skipped (already present): ${skipped}`)
if (errors.length > 0) {
    console.error("\nErrors:")
    for (const e of errors) console.error("  - " + e)
    process.exit(1)
}
