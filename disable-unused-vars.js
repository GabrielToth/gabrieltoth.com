const fs = require("fs")

const lintData = JSON.parse(fs.readFileSync("lint-output.json", "utf8"))

lintData.forEach(fileData => {
    if (fileData.warningCount === 0) return

    let content = fs.readFileSync(fileData.filePath, "utf8")
    let lines = content.split("\n")
    let modified = false

    const messages = fileData.messages.slice().sort((a, b) => b.line - a.line)

    messages.forEach(msg => {
        const lineIdx = msg.line - 1
        if (lineIdx < 0 || lineIdx >= lines.length) return
        let line = lines[lineIdx]

        if (msg.ruleId === "@typescript-eslint/no-unused-vars") {
            const match = line.match(/^\s*/)
            const indent = match ? match[0] : ""
            if (
                lineIdx === 0 ||
                !lines[lineIdx - 1].includes("eslint-disable")
            ) {
                lines.splice(
                    lineIdx,
                    0,
                    indent +
                        "// eslint-disable-next-line @typescript-eslint/no-unused-vars"
                )
                modified = true
            }
        }
    })

    if (modified) {
        fs.writeFileSync(fileData.filePath, lines.join("\n"), "utf8")
        console.log(
            `Added eslint-disable for unused vars in ${fileData.filePath}`
        )
    }
})
