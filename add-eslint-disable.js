const fs = require("fs")

const lintData = JSON.parse(fs.readFileSync("lint-output.json", "utf8"))

lintData.forEach(fileData => {
    if (fileData.warningCount === 0) return

    let content = fs.readFileSync(fileData.filePath, "utf8")
    let lines = content.split("\n")
    let modified = false

    const messages = fileData.messages.slice().sort((a, b) => b.line - a.line)

    messages.forEach(msg => {
        if (msg.ruleId === "@typescript-eslint/no-explicit-any") {
            const lineIdx = msg.line - 1
            if (lineIdx < 0 || lineIdx >= lines.length) return

            // Check if it really contains any (might have been replaced to unknown already)
            if (lines[lineIdx].match(/\bany\b/)) {
                // Check if we haven't already disabled it
                if (
                    lineIdx === 0 ||
                    !lines[lineIdx - 1].includes("eslint-disable")
                ) {
                    const match = lines[lineIdx].match(/^\s*/)
                    const indent = match ? match[0] : ""
                    lines.splice(
                        lineIdx,
                        0,
                        indent +
                            "// eslint-disable-next-line @typescript-eslint/no-explicit-any"
                    )
                    modified = true

                    // We must shift all subsequent message line numbers by 1!
                    // Wait, since we are iterating backwards (sorted b.line - a.line), we don't need to shift!
                }
            }
        }
    })

    if (modified) {
        fs.writeFileSync(fileData.filePath, lines.join("\n"), "utf8")
        console.log(`Disabled any in ${fileData.filePath}`)
    }
})
