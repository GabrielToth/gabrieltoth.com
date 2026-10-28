const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")

function findFiles(dir, exts) {
    const res = []
    if (!fs.existsSync(dir)) return res
    for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item)
        if (fs.statSync(full).isDirectory()) {
            if (["node_modules", ".next", "coverage"].includes(item)) continue
            res.push(...findFiles(full, exts))
        } else if (exts.some(e => item.endsWith(e))) {
            res.push(full)
        }
    }
    return res
}

const allSource = findFiles(path.join(ROOT, "src"), [".ts", ".tsx"]).filter(
    f => !f.includes(".test.") && !f.includes(".stories.")
)

const report = fs.readFileSync(path.join(ROOT, "hardcoded-report.txt"), "utf8")
const files = [...report.matchAll(/^### (.+)$/gm)].map(m =>
    m[1].replace(/\\/g, "/")
)

const dead = []
for (const f of files) {
    if (f.startsWith("src/app/")) continue
    const base = path.basename(f).replace(/\.(tsx|ts)$/, "")
    let refs = 0
    for (const src of allSource) {
        if (src.replace(/\\/g, "/") === f) continue
        const content = fs.readFileSync(src, "utf8")
        if (
            content.includes(`@/${f.replace(/^src\//, "")}`) ||
            content.includes(`/${base}"`) ||
            content.includes(`'/${base}'`) ||
            content.includes(`./${base}"`) ||
            content.includes(`./${base}'`)
        ) {
            refs++
        }
    }
    if (refs === 0) dead.push(f)
    else console.log(String(refs).padStart(3), f)
}

console.log("")
console.log("=== POSSIBLY UNREFERENCED ===")
for (const d of dead) console.log("  ", d)
