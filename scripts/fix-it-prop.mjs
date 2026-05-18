import fs from "node:fs"
import path from "node:path"

const files = process.argv.slice(2)

for (const file of files) {
    let content = fs.readFileSync(file, "utf8")

    content = content.replace(
        /import \{ test as it \} from "@fast-check\/vitest"\r?\nimport \* as fc from "fast-check"/,
        'import { fc, test } from "@fast-check/vitest"'
    )

    const propRe = /(\s+)it\.prop\(\s*(\[[\s\S]*?\]),\s*async\s*\(/g
    let index = 0
    content = content.replace(propRe, (_match, indent, arbitraries) => {
        index += 1
        const before = content.slice(0, content.indexOf(_match))
        const commentMatch = before.match(
            /\/\*\*[\s\S]*?Property Test: ([^\n*]+)[\s\S]*?\*\/\s*$/m
        )
        const title = commentMatch
            ? `should satisfy: ${commentMatch[1].trim()}`
            : `property test ${index}`
        return `${indent}test.prop(${arbitraries})(
${indent}    "${title}",
${indent}    async (`
    })

    fs.writeFileSync(file, content)
    console.log(`fixed ${file}: ${index} properties`)
}
