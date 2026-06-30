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
    "src/app/[locale]/gestion-de-canales/page.tsx",
    "src/app/[locale]/kanalverwaltung/page.tsx",
    "src/app/[locale]/minecraft/minecraft-submenu.tsx",
    "src/app/[locale]/nutzungsbedingungen/page.tsx",
    "src/app/[locale]/optimizacion-de-pc/page.tsx",
    "src/app/[locale]/otimizacao-de-pc/page.tsx",
    "src/app/[locale]/pc-optimierung/page.tsx",
    "src/app/[locale]/personlichkeitstest/page.tsx",
    "src/app/[locale]/politica-de-privacidad/page.tsx",
    "src/app/[locale]/politica-de-privacidade/page.tsx",
    "src/app/[locale]/prueba-de-ci/page.tsx",
    "src/app/[locale]/prueba-de-personalidad/page.tsx",
    "src/app/[locale]/quem-sou-eu/page.tsx",
    "src/app/[locale]/services/services-submenu.tsx",
    "src/app/[locale]/terminos-de-servicio/page.tsx",
    "src/app/[locale]/termos-de-servico/page.tsx",
    "src/app/[locale]/teste-de-personalidade/page.tsx",
    "src/app/[locale]/teste-de-qi/page.tsx",
    "src/app/[locale]/uber-mich/page.tsx",
    "src/app/[locale]/acerca-de-mi/page.tsx",
    "src/app/[locale]/datenschutzrichtlinie/page.tsx",
    "src/app/[locale]/editoren/page.tsx",
    "src/app/[locale]/editores/page.tsx",
    "src/app/[locale]/gerenciamento-de-canais/page.tsx",
    "src/app/api/auth/oauth/callback/route.ts",
    "src/app/api/groups/[groupId]/networks/[platform]/route.ts",
    "src/app/api/groups/[groupId]/networks/route.ts",
    "src/app/api/networks/[platform]/connect/route.ts",
    "src/app/api/networks/[platform]/disconnect/route.ts",
    "src/app/api/oauth/authorize/[platform]/route.ts",
    "src/app/api/oauth/callback/[platform]/route.ts",
    "src/app/api/oauth/disconnect/[platform]/route.ts",
    "src/app/api/posts/validate/route.ts",
    "src/app/api/queue/process/route.ts",
    "src/app/api/webhooks/facebook/route.ts",
    "src/app/api/webhooks/instagram/route.ts",
    "src/app/api/webhooks/tiktok/route.ts",
    "src/app/dashboard/publish/page.tsx",
    "src/app/[locale]/dashboard/publish/page.tsx",
    "src/components/publish/NetworkSelector.tsx",
    "src/components/publish/PostingInterface.tsx",
    "src/components/publish/PostingScheduler.tsx",
    "src/lib/api/posts.ts",
]

lintData.forEach(fileData => {
    if (fileData.warningCount === 0) return

    const normalizedPath = fileData.filePath.replace(/\\/g, "/")
    if (skipFiles.some(f => normalizedPath.endsWith(f))) {
        return // Skip these files completely for any -> unknown
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
        }
        lines[lineIdx] = line
    })

    if (modified) {
        fs.writeFileSync(fileData.filePath, lines.join("\n"), "utf8")
    }
})
