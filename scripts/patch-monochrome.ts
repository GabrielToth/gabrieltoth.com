import fs from "fs"

const files = process.argv.slice(2)

function processFile(filePath: string) {
    if (!fs.existsSync(filePath)) return
    let content = fs.readFileSync(filePath, "utf8")
    let changed = false

    const replacements: Array<[string, string]> = [
        ["#1a1a1a", "#0a0a0a"],
        ["#2d2d2d", "#171717"],
        ["text-neutral-400", "text-muted-foreground"],
        ["text-neutral-500", "text-muted-foreground"],
    ]

    for (const [fromStr, toStr] of replacements) {
        if (content.includes(fromStr)) {
            content = content.replaceAll(fromStr, toStr)
            changed = true
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, "utf8")
        console.log(`Updated: ${filePath}`)
    }
}

files.forEach(processFile)
