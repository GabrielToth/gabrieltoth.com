import fs from "node:fs"
import path from "node:path"

function walk(dir, files = []) {
    for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name)
        const st = fs.statSync(p)
        if (st.isDirectory()) {
            if (name !== "node_modules") walk(p, files)
        } else if (/\.(test|spec)\.(ts|tsx)$/.test(name)) {
            files.push(p)
        }
    }
    return files
}

const root = path.join(process.cwd(), "src")
let changed = 0

for (const file of walk(root)) {
    let content = fs.readFileSync(file, "utf8")
    const original = content

    content = content.replace(
        /\bbeforeAll\(async ctx =>/g,
        "beforeAll(async ({ skip }) =>"
    )
    content = content.replace(
        /\bbeforeEach\(async ctx =>/g,
        "beforeEach(async ({ skip }) =>"
    )
    content = content.replace(
        /\bit(?:\.(?:only|skip|todo|concurrent|fails))?\(\s*([^,]+),\s*async ctx =>/g,
        (m, title) => m.replace("async ctx =>", "async ({ skip }) =>")
    )
    content = content.replace(
        /\btest(?:\.(?:only|skip|todo|concurrent|fails))?\(\s*([^,]+),\s*async ctx =>/g,
        m => m.replace("async ctx =>", "async ({ skip }) =>")
    )
    content = content.replace(
        /skipSuiteWithoutPostgres\(ctx\)/g,
        "skipSuiteWithoutPostgres({ skip })"
    )
    content = content.replace(/return ctx\.skip\(\)/g, "return skip()")
    content = content.replace(/ctx\.skip\(\)/g, "skip()")

    if (content !== original) {
        fs.writeFileSync(file, content)
        changed++
        console.log("updated", path.relative(process.cwd(), file))
    }
}

console.log(`done: ${changed} files`)
