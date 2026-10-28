/**
 * Heuristic scanner for hardcoded user-facing strings in JSX/TSX files.
 *
 * Flags:
 *  - JSX text nodes that look like prose (not punctuation/numbers/symbols)
 *  - String literals assigned to user-facing attributes:
 *    placeholder, title, aria-label, alt, label, tooltip, description
 *
 * Ignores:
 *  - test/stories files
 *  - strings inside comments
 *  - className, id, name, key, href, src, role, type, data-*, etc.
 *  - strings with i18n key-like shape (a.b.c) passed to translators
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")
const SCAN_DIRS = ["src/app", "src/components"]

function findFiles(dir) {
    const res = []
    if (!fs.existsSync(dir)) return res
    for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item)
        if (fs.statSync(full).isDirectory()) {
            res.push(...findFiles(full))
        } else if (
            (item.endsWith(".tsx") || item.endsWith(".ts")) &&
            !item.includes(".test.") &&
            !item.includes(".stories.") &&
            !item.endsWith(".d.ts")
        ) {
            res.push(full)
        }
    }
    return res
}

const files = SCAN_DIRS.flatMap(d => findFiles(path.join(ROOT, d)))

const ALLOW_PATTERNS = [
    /^[\s\d\p{P}\p{S}]+$/u, // punctuation/numbers/symbols only
    /^https?:\/\//, // urls
    /^[a-z0-9-]+$/i, // single token / slugs / ids
    /^\.[a-z0-9-]+$/i, // class-ish
    /^[A-Z0-9_]+$/, // CONSTANTS
    /^\d+(px|rem|em|%|s|ms|vh|vw)?$/,
]

// Code-like content that JSX-text regex may capture by mistake
const CODE_PATTERNS = [
    /\b(return|const|let|var|function|useState|useEffect|Array|Record|Promise|interface|type|import|export)\b/,
    /=>/,
    /[(){}[\]]/, // parens/brackets/braces
    /[;=]/,
    /\bas\b\s*[A-Za-z]/,
    /\bclassName\b/,
    /^\s*(<|>|\.\.\.)/,
]

function looksLikeProse(s) {
    const t = s.trim()
    if (t.length < 2) return false
    for (const p of ALLOW_PATTERNS) if (p.test(t)) return false
    for (const p of CODE_PATTERNS) if (p.test(t)) return false
    // Must contain at least one letter
    if (!/\p{L}/u.test(t)) return false
    // Require wordish content (letters + space, or >3 letters)
    const letterCount = (t.match(/\p{L}/gu) || []).length
    if (letterCount < 4) return false
    if (!/\s/.test(t) && letterCount < 6) return false
    return true
}

const USER_ATTRS = [
    "placeholder",
    "title",
    "aria-label",
    "alt",
    "label",
    "tooltip",
    "description",
    "aria-description",
    "aria-placeholder",
]

const findings = []

for (const filePath of files) {
    const rel = path.relative(ROOT, filePath)
    const raw = fs.readFileSync(filePath, "utf8")

    // Strip block comments and line comments to reduce noise
    const content = raw
        .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "))
        .replace(/\/\/[^\n]*/g, m => m.replace(/[^\n]/g, " "))

    const lines = content.split("\n")

    // 1) JSX text nodes: >some text<
    const jsxTextRegex = />\s*([^<>{}\n][^<>{}\n]*?)\s*</g
    let m
    while ((m = jsxTextRegex.exec(content))) {
        const text = m[1]
        if (!looksLikeProse(text)) continue
        if (/\{|\}/.test(text)) continue
        const before = content.slice(0, m.index)
        const line = before.split("\n").length
        findings.push({
            file: rel,
            line,
            kind: "jsx-text",
            text: text.trim(),
        })
    }

    // 2) User-facing attributes with string literal
    for (const attr of USER_ATTRS) {
        const re = new RegExp(
            attr.replace("-", "\\-") +
                '\\s*=\\s*(?:"([^"]+)"|\'([^\']+)\'|\\{\\s*"([^"]+)"\\s*\\})',
            "g"
        )
        let am
        while ((am = re.exec(content))) {
            const text = am[1] || am[2] || am[3]
            if (!text) continue
            if (!looksLikeProse(text)) continue
            // If it's a translator call result we wouldn't have a literal
            const before = content.slice(0, am.index)
            const line = before.split("\n").length
            findings.push({
                file: rel,
                line,
                kind: attr,
                text: text.trim(),
            })
        }
    }

    void lines
}

// Dedupe
const seen = new Set()
const unique = []
for (const f of findings) {
    const id = f.file + ":" + f.line + ":" + f.kind + ":" + f.text
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(f)
}

// Group by file
const byFile = {}
for (const f of unique) {
    byFile[f.file] = byFile[f.file] || []
    byFile[f.file].push(f)
}

const sortedFiles = Object.keys(byFile).sort()
console.log("Scanned files:", files.length)
console.log("Files with findings:", sortedFiles.length)
console.log("Total findings:", unique.length)
console.log("")

for (const file of sortedFiles) {
    console.log("### " + file)
    for (const f of byFile[file]) {
        console.log(
            "  " + f.line + " [" + f.kind + "] " + JSON.stringify(f.text)
        )
    }
    console.log("")
}
