const fs = require("fs")
const path = require("path")

const locales = ["pt-BR", "en", "es", "de", "fr"]
const i18nDir = path.join(__dirname, "../src/i18n")

function loadMessages(locale) {
    const messages = {}
    const dir = path.join(i18nDir, locale)
    for (const f of fs.readdirSync(dir)) {
        if (f.endsWith(".json")) {
            const name = f.replace(".json", "")
            if (name === "layout.header") {
                messages.layout = messages.layout || {}
                messages.layout.header = JSON.parse(
                    fs.readFileSync(path.join(dir, f), "utf8")
                )
            } else if (name === "layout.footer") {
                messages.layout = messages.layout || {}
                messages.layout.footer = JSON.parse(
                    fs.readFileSync(path.join(dir, f), "utf8")
                )
            } else {
                messages[name] = JSON.parse(
                    fs.readFileSync(path.join(dir, f), "utf8")
                )
            }
        }
    }
    return messages
}

const allMessages = {}
for (const loc of locales) {
    allMessages[loc] = loadMessages(loc)
}

function getNested(obj, pathParts) {
    let cur = obj
    for (const p of pathParts) {
        if (cur === undefined || cur === null) return undefined
        cur = cur[p]
    }
    return cur
}

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
            !item.includes(".stories.")
        ) {
            res.push(full)
        }
    }
    return res
}

const appFiles = findFiles(path.join(__dirname, "../src/app/[locale]"))
const compFiles = findFiles(path.join(__dirname, "../src/components"))
const allFiles = [...appFiles, ...compFiles]

console.log("Scanning " + allFiles.length + " page and component files...")

const errors = []

for (const filePath of allFiles) {
    const rel = path.relative(path.join(__dirname, ".."), filePath)
    const content = fs.readFileSync(filePath, "utf8")

    const translatorMap = {}

    // Robust extraction of useTranslations and getTranslations
    // 1. namespace: "something" inside getTranslations({ ... }) or useTranslations({ ... })
    // 2. "something" inside getTranslations("something") or useTranslations("something")
    // 3. no arguments
    const declMatches = content.matchAll(
        /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(([\s\S]*?)\)/g
    )
    for (const dm of declMatches) {
        const varName = dm[1]
        const argsStr = dm[2].trim()
        let ns = null
        if (argsStr.startsWith("{")) {
            const nsMatch = argsStr.match(/namespace\s*:\s*['"]([^'"]+)['"]/)
            if (nsMatch) ns = nsMatch[1]
        } else if (argsStr.length > 0) {
            const strMatch = argsStr.match(/['"]([^'"]+)['"]/)
            if (strMatch) ns = strMatch[1]
        }
        translatorMap[varName] = ns
    }

    if (Object.keys(translatorMap).length === 0) continue

    for (const [varName, ns] of Object.entries(translatorMap)) {
        // Match varName('key') or varName.raw('key')
        const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const callRegex = new RegExp(
            "(?:\\b" +
                escaped +
                ")(?:\\.raw)?\\s*\\(\\s*['`\"]([^'`\"]+)['`\"]",
            "g"
        )
        for (const callMatch of content.matchAll(callRegex)) {
            const key = callMatch[1]

            // Skip dynamic/template-literal keys (e.g. `plan.${plan}`)
            if (/[${}`]/.test(key)) continue

            // Skip concatenated dynamic keys (e.g. t("plan." + organization.plan))
            const after = content.slice(
                callMatch.index + callMatch[0].length,
                callMatch.index + callMatch[0].length + 6
            )
            if (/^\s*[+]/.test(after)) continue

            for (const loc of locales) {
                let found = false
                if (ns) {
                    const nsParts = ns.split(".")
                    const root = getNested(allMessages[loc], nsParts)
                    if (root !== undefined) {
                        const keyParts = key.split(".")
                        if (getNested(root, keyParts) !== undefined) {
                            found = true
                        }
                    }
                } else {
                    const keyParts = key.split(".")
                    if (getNested(allMessages[loc], keyParts) !== undefined) {
                        found = true
                    }
                }

                if (!found) {
                    errors.push({
                        file: rel,
                        varName,
                        ns,
                        key,
                        locale: loc,
                    })
                }
            }
        }
    }
}

console.log("Done scanning translator calls. Found issues:", errors.length)
if (errors.length > 0) {
    const grouped = {}
    for (const e of errors) {
        const k = e.file + " -> " + (e.ns ? e.ns + "." : "") + e.key
        grouped[k] = grouped[k] || new Set()
        grouped[k].add(e.locale)
    }
    for (const [k, locs] of Object.entries(grouped)) {
        console.log(
            "MISSING TRANSLATION KEY:",
            k,
            "in",
            Array.from(locs).join(", ")
        )
    }
}
