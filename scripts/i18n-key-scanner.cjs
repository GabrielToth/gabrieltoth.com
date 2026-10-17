/**
 * i18n-key-scanner.cjs — Static analysis of t("...") usage vs locale JSONs.
 * Scans every src TypeScript file, extracts useTranslations/getTranslations
 * namespaces and t("key") calls, then verifies every resolved key exists in
 * ALL locales (pt-BR, en, es, de, fr).
 *
 * Usage:
 *   node scripts/i18n-key-scanner.cjs            # report only
 *   node scripts/i18n-key-scanner.cjs --json     # machine-readable
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const SRC = path.join(ROOT, "src")
const LOCALES = ["pt-BR", "en", "es", "de", "fr"]
const I18N_DIR = path.join(SRC, "i18n")

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (
                e.name === "__tests__" ||
                e.name.includes(".test.") ||
                e.name === "node_modules"
            )
                continue
            walk(p, out)
        } else if (
            /\.(tsx?|ts)$/.test(e.name) &&
            !/\.(test|spec)\./.test(e.name)
        ) {
            out.push(p)
        }
    }
    return out
}

function getLoc(text) {
    const loc = text.match(/locales\s*=\s*\[([^\]]+)\]/)
    if (loc) return [...loc[1].matchAll(/["']([^"']+)["']/g)].map(m => m[1])
    return null
}

// Load all locale namespaces
const localeData = {}
for (const l of LOCALES) {
    const dir = path.join(I18N_DIR, l)
    const data = {}
    for (const f of fs.readdirSync(dir)) {
        if (f.endsWith(".json"))
            data[f.replace(".json", "")] = JSON.parse(
                fs.readFileSync(path.join(dir, f), "utf8")
            )
    }
    localeData[l] = data
}

function resolveKey(obj, keyPath) {
    let o = obj
    for (const p of keyPath) {
        if (o == null || typeof o !== "object") return undefined
        o = o[p]
    }
    return typeof o === "string" || typeof o === "number" ? o : undefined
}

const files = walk(SRC)
const report = [] // {file, ns, key, missingLocales[]}

for (const file of files) {
    const text = fs.readFileSync(file, "utf8")

    // skip locale definition files & i18n config
    if (file.includes(path.join("src", "i18n")) || file.includes("i18n.ts"))
        continue

    // Find all namespace declarations in the file.
    // Client: useTranslations("ns") — hook form
    // Server: getTranslations({ locale, namespace: "ns" }) or getTranslations("ns")
    const nsDecls = []
    for (const m of text.matchAll(/useTranslations\(\s*["']([^"']+)["']\s*\)/g))
        nsDecls.push({ ns: m[1], global: false })
    for (const m of text.matchAll(/useTranslations\(\s*\)/g))
        nsDecls.push({ ns: "", global: true })
    for (const m of text.matchAll(
        /getTranslations\(\s*\{\s*[^}]*?namespace:\s*["']([^"']+)["']/g
    ))
        nsDecls.push({ ns: m[1], global: false })
    for (const m of text.matchAll(/getTranslations\(\s*["']([^"']+)["']\s*\)/g))
        nsDecls.push({ ns: m[1], global: false })

    // Namespace declarations WITH variable names — a file can have multiple
    // translation vars (t, tHome, ...) bound to different namespaces.
    // Client: const t = useTranslations("ns")
    // Server: const t = await getTranslations({..., namespace: "ns"})
    const nsByVar = new Map() // varName -> ns
    const varEvents = []
    for (const m of text.matchAll(
        /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(?:\{[^}]*?namespace:\s*["']([^"']+)["'][^}]*?\}|["']([^"']+)["'])/g
    )) {
        varEvents.push({ pos: m.index, varName: m[1], ns: m[2] || m[3] })
    }
    // bare useTranslations()/getTranslations() — no namespace
    for (const m of text.matchAll(
        /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*\)/g
    )) {
        varEvents.push({ pos: m.index, varName: m[1], ns: "" })
    }
    // getTranslations({ locale, namespace: "ns" }) without assignment (inline use)
    const inlineNs = []
    for (const m of text.matchAll(
        /getTranslations\s*\(\s*\{[^}]*?namespace:\s*["']([^"']+)["']/g
    )) {
        inlineNs.push({ pos: m.index, ns: m[1] })
    }

    const tCalls = []
    // t("key") — variable-aware: VAR("key") where VAR is a known translation var
    const knownVars = new Set(varEvents.map(v => v.varName))
    for (const m of text.matchAll(
        /\b([A-Za-z_$][\w$]*)\(\s*["']([a-zA-Z0-9_.-]+)["']\s*[),}]/g
    )) {
        const varName = m[1]
        if (!knownVars.has(varName)) continue
        // skip .raw() and non-translation calls
        const before = text.slice(Math.max(0, m.index - 8), m.index)
        if (/\.raw$|\./.test(before)) continue
        tCalls.push({ pos: m.index, varName, key: m[2] })
    }
    // th("key") alias used in some components
    for (const m of text.matchAll(
        /(?:const|let|var)\s+(th)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*["']([^"']+)["']/g
    )) {
        varEvents.push({ pos: m.index, varName: "th", ns: m[2] })
    }

    if (!tCalls.length) continue

    // resolve each call: find the ns decl for its variable that appears
    // EARLIER in the file (last one before the call wins)
    const namespacedKeys = new Map() // "ns:key" -> true
    for (const tc of tCalls) {
        let ns = ""
        let best = -1
        for (const v of varEvents) {
            if (v.varName === tc.varName && v.pos < tc.pos) {
                ns = v.ns
                best = v.pos
            }
        }
        // if variable not bound (e.g. destructured or passed as prop), fall
        // back to the closest namespace decl before the call
        if (best === -1) {
            const fallback = [...inlineNs].reverse().find(n => n.pos < tc.pos)
            const fallbackVar = varEvents.filter(v => v.pos < tc.pos).pop()
            ns = (fallback && fallbackVar ? fallback.ns : "") || ""
        }
        namespacedKeys.set((ns ? ns + ":" : "") + tc.key, true)
    }

    for (const [nk] of namespacedKeys) {
        const ci = nk.indexOf(":")
        const ns = ci >= 0 ? nk.slice(0, ci) : ""
        const key = ci >= 0 ? nk.slice(ci + 1) : nk
        const nsFile = ns || "common"
        // find which JSON file contains this namespace root
        for (const l of LOCALES) {
            // namespace can be "a.b" → file "a", remaining parts are root path
            let file = nsFile,
                rootPath = key.split(".")
            if (ns && !localeData[l][ns]) {
                const parts = ns.split(".")
                // try first part as file
                if (localeData[l][parts[0]]) {
                    file = parts[0]
                    rootPath = [...parts.slice(1), ...key.split(".")]
                }
            } else if (ns) {
                file = ns
            }
            const tree = localeData[l][file]
            if (!tree) {
                report.push({
                    file: path.relative(ROOT, file),
                    ns,
                    key,
                    locale: l,
                    reason: "no-namespace-file",
                })
                continue
            }
            const v = resolveKey(tree, rootPath)
            if (v === undefined) {
                report.push({
                    file: path.relative(ROOT, file),
                    ns,
                    key,
                    locale: l,
                    reason: "missing-key",
                })
            }
        }
    }
}

// aggregate per (ns,key): missing locales
const agg = {}
for (const r of report) {
    const k = `${r.ns}::${r.key}`
    if (!agg[k])
        agg[k] = { ns: r.ns, key: r.key, missing: [], files: new Set() }
    agg[k].missing.push(r.locale)
    agg[k].files.add(r.file)
}
const aggList = Object.values(agg).map(a => ({
    ...a,
    missing: [...new Set(a.missing)].sort(),
    files: [...a.files],
}))

if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify(aggList, null, 1))
} else {
    const perLocale = {}
    for (const a of aggList)
        for (const m of a.missing) perLocale[m] = (perLocale[m] || 0) + 1
    console.log(
        `Scanned ${files.length} files. ${aggList.length} keys missing somewhere.`
    )
    console.log("Per-locale missing counts:", JSON.stringify(perLocale))
    console.log("")
    for (const a of aggList)
        console.log(
            `  [${a.ns}] ${a.key} — missing in: ${a.missing.join(", ")} (${a.files[0]})`
        )
}
