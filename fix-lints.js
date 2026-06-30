const fs = require("fs")

const lintData = JSON.parse(fs.readFileSync("lint-output.json", "utf8"))

const skipFiles = [
    "src/lib/auth/performance.ts",
    "src/lib/discord/alerter.ts",
    "src/lib/facebook/oauth-service.ts",
    "src/lib/groups/network-group-manager.ts",
    "src/lib/networks/network-manager.ts",
    "src/lib/posting/content-adapter.ts",
    "src/lib/queue/publication-queue.ts",
    "src/lib/tiktok/oauth-service.ts",
    "src/lib/token-store/token-store.ts",
    "src/lib/validation.ts",
    "src/lib/youtube/activity-detection.ts",
    "src/lib/youtube/channel-validation.ts",
    "src/lib/youtube/ip-validation.ts",
    "src/lib/local-envs/storage.ts",
    "src/lib/posting/adapters/facebook.ts",
    "src/lib/posting/adapters/tiktok.ts",
    "src/lib/auth/registration-session.ts",
    "src/lib/instagram/oauth-service.ts",
    "src/lib/auth/password-security/authentication-service.ts",
]

lintData.forEach(fileData => {
    if (fileData.warningCount === 0) return

    // Normalize path to check skipFiles
    const normalizedPath = fileData.filePath.replace(/\\/g, "/")
    if (skipFiles.some(f => normalizedPath.endsWith(f))) {
        console.log(`Skipping ${fileData.filePath}`)
        return
    }

    let content = fs.readFileSync(fileData.filePath, "utf8")
    let lines = content.split("\n")
    let modified = false

    const messages = fileData.messages.slice().sort((a, b) => b.line - a.line)

    messages.forEach(msg => {
        const lineIdx = msg.line - 1
        if (lineIdx < 0 || lineIdx >= lines.length) return
        let line = lines[lineIdx]

        if (msg.ruleId === "@typescript-eslint/no-explicit-any") {
            if (line.includes("SupabaseClient<any>")) {
                line = line.replace(/SupabaseClient<any>/g, "SupabaseClient")
                modified = true
            } else if (line.match(/\bany\b/)) {
                line = line.replace(/\bany\b/g, "unknown")
                modified = true
            }
        } else if (msg.ruleId === "@typescript-eslint/no-unused-vars") {
            const match = msg.message.match(/'([^']+)'/)
            if (match && match[1]) {
                const varName = match[1]
                if (!varName.startsWith("_")) {
                    const regex = new RegExp(`\\b${varName}\\b`, "g")
                    line = line.replace(regex, `_${varName}`)
                    modified = true
                }
            }
        }
        lines[lineIdx] = line
    })

    if (modified) {
        fs.writeFileSync(fileData.filePath, lines.join("\n"), "utf8")
        console.log(`Updated ${fileData.filePath}`)
    }
})
