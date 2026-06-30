const fs = require("fs")

function replaceAllFileContent(filePath, targetContent, replacementContent) {
    if (!fs.existsSync(filePath)) return
    let content = fs.readFileSync(filePath, "utf8")
    content = content.split(targetContent).join(replacementContent)
    fs.writeFileSync(filePath, content)
}

const filesToFixProps = [
    "src/app/[locale]/gestion-de-canales/page.tsx",
    "src/app/[locale]/kanalverwaltung/page.tsx",
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
    "src/app/[locale]/terminos-de-servicio/page.tsx",
    "src/app/[locale]/termos-de-servico/page.tsx",
    "src/app/[locale]/teste-de-personalidade/page.tsx",
    "src/app/[locale]/teste-de-qi/page.tsx",
    "src/app/[locale]/uber-mich/page.tsx",
    "src/app/api/auth/oauth/callback/route.ts",
]

for (const file of filesToFixProps) {
    if (!fs.existsSync(file)) continue
    let content = fs.readFileSync(file, "utf8")

    // Fix props passing
    content = content.replace(
        /generateMetadata\(props: unknown\)/g,
        "generateMetadata(props: any)"
    )
    content = content.replace(
        /generateChannelMetadata\(props\)/g,
        "generateChannelMetadata(props as any)"
    )
    content = content.replace(
        /generatePageMetadata\(props\)/g,
        "generatePageMetadata(props as any)"
    )
    content = content.replace(
        /generateAboutMetadata\(props\)/g,
        "generateAboutMetadata(props as any)"
    )
    content = content.replace(
        /generateTOSMetadata\(props\)/g,
        "generateTOSMetadata(props as any)"
    )
    content = content.replace(
        /generatePrivacyMetadata\(props\)/g,
        "generatePrivacyMetadata(props as any)"
    )
    content = content.replace(
        /generateIQMetadata\(props\)/g,
        "generateIQMetadata(props as any)"
    )
    content = content.replace(
        /generatePersonalityMetadata\(props\)/g,
        "generatePersonalityMetadata(props as any)"
    )
    content = content.replace(
        /generateMinecraftMetadata\(props\)/g,
        "generateMinecraftMetadata(props as any)"
    )
    content = content.replace(
        /generatePCOptimizationMetadata\(props\)/g,
        "generatePCOptimizationMetadata(props as any)"
    )

    // Fix route.ts
    if (file === "src/app/api/auth/oauth/callback/route.ts") {
        content = content.replace(
            "JSON.parse(state)",
            "JSON.parse(state) as any"
        )
    }

    fs.writeFileSync(file, content)
}

// 1. Fix OAuthPlatform casts
const oauthFiles = [
    "src/app/api/oauth/authorize/[platform]/route.ts",
    "src/app/api/oauth/callback/[platform]/route.ts",
    "src/app/api/oauth/disconnect/[platform]/route.ts",
]
for (const file of oauthFiles) {
    replaceAllFileContent(
        file,
        "params.platform as unknown",
        "params.platform as any"
    )
}

// 2. Fix posts validate
replaceAllFileContent(
    "src/app/api/posts/validate/route.ts",
    "platforms as unknown",
    "platforms as any"
)

// 3. Fix queue process
replaceAllFileContent(
    "src/app/api/queue/process/route.ts",
    "const publication: unknown = await request.json()",
    "const publication: any = await request.json()"
)

// 4. Fix webhooks
replaceAllFileContent(
    "src/app/api/webhooks/facebook/route.ts",
    "event as unknown",
    "event as any"
)
replaceAllFileContent(
    "src/app/api/webhooks/instagram/route.ts",
    "event as unknown",
    "event as any"
)
replaceAllFileContent(
    "src/app/api/webhooks/tiktok/route.ts",
    "event.type as unknown",
    "event.type as any"
)

// 5. Fix api/posts.ts
replaceAllFileContent(
    "src/lib/api/posts.ts",
    "map((p: unknown) => ({",
    "map((p: any) => ({"
)

// Fix dashboard publish page
replaceAllFileContent(
    "src/app/dashboard/publish/page.tsx",
    "map((p: unknown) =>",
    "map((p: any) =>"
)
replaceAllFileContent(
    "src/app/dashboard/publish/page.tsx",
    "(n: unknown) =>",
    "(n: any) =>"
)

// Fix network selector
replaceAllFileContent(
    "src/components/publish/NetworkSelector.tsx",
    "(prev: unknown) =>",
    "(prev: any) =>"
)
replaceAllFileContent(
    "src/components/publish/PostingInterface.tsx",
    "(n: unknown)",
    "(n: any)"
)
replaceAllFileContent(
    "src/components/publish/PostingScheduler.tsx",
    "(prev: unknown)",
    "(prev: any)"
)
replaceAllFileContent(
    "src/app/api/groups/[groupId]/networks/[platform]/route.ts",
    "params.platform as unknown",
    "params.platform as any"
)
replaceAllFileContent(
    "src/app/api/groups/[groupId]/networks/route.ts",
    "requestData.platform as unknown",
    "requestData.platform as any"
)
replaceAllFileContent(
    "src/app/api/networks/[platform]/connect/route.ts",
    "params.platform as unknown",
    "params.platform as any"
)
replaceAllFileContent(
    "src/app/api/networks/[platform]/disconnect/route.ts",
    "params.platform as unknown",
    "params.platform as any"
)
replaceAllFileContent(
    "src/app/[locale]/minecraft/minecraft-submenu.tsx",
    "as unknown",
    "as any"
)
replaceAllFileContent(
    "src/app/[locale]/services/services-submenu.tsx",
    "as unknown",
    "as any"
)

console.log("Applied fallback any fixes.")
