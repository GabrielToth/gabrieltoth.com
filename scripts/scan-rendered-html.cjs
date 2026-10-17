#!/usr/bin/env node
/**
 * scan-rendered-html.cjs — Sweeps prerendered HTML for raw i18n keys.
 * A raw key looks like "a.b" or "a.b.c" appearing as visible text content
 * where a translated string should be. Detects MISSING_MESSAGE fallthrough.
 */
const fs = require("fs")
const path = require("path")

const APP_DIR = path.join(__dirname, "..", ".next", "server", "app")

function walkHtml(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name)
        if (e.isDirectory()) walkHtml(p, out)
        else if (e.name.endsWith(".html")) out.push(p)
    }
    return out
}

// Known key namespaces in the app — a visible "a.b" string is only
// suspicious if `a` matches a known namespace/file.
const LOCALE_FILES = fs
    .readdirSync(path.join(__dirname, "..", "src", "i18n", "pt-BR"))
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""))
const NS = new Set(LOCALE_FILES.flatMap(f => [f, ...f.split(".")]))

const htmlFiles = walkHtml(APP_DIR)
console.log(`Scanning ${htmlFiles.length} prerendered HTML files...`)

const findings = []
for (const f of htmlFiles) {
    const html = fs.readFileSync(f, "utf8")
    // strip script/style content
    const body = html
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<style[\s\S]*?<\/style>/g, "")
    // visible text: between > and <
    const textMatches = body.match(/>([^<>]+)</g) || []
    for (const tm of textMatches) {
        const text = tm.slice(1, -1).trim()
        // raw key pattern: 2-4 dot segments, camelCase/dots, mostly ASCII letters
        if (!/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+){1,4}$/.test(text)) continue
        const first = text.split(".")[0]
        if (!NS.has(first)) continue
        findings.push({ file: path.relative(process.cwd(), f), text })
    }
}

console.log(`Raw-key findings: ${findings.length}`)
for (const x of findings) console.log(`  ${x.file} → "${x.text}"`)
if (findings.length === 0)
    console.log("CLEAN — no raw i18n keys visible in any prerendered page.")
