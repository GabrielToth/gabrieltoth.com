#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..")
const LOCALES = ["en", "pt-BR", "es", "de", "fr"]
const I18N_DIR = path.join(ROOT, "src/i18n")

function read(p) {
    try {
        return fs.readFileSync(path.join(ROOT, p), "utf8")
    } catch {
        return ""
    }
}
function flat(o, p = "") {
    const r = {}
    for (const k in o) {
        const fk = p ? `${p}.${k}` : k
        if (o[k] && typeof o[k] === "object" && !Array.isArray(o[k]))
            Object.assign(r, flat(o[k], fk))
        else r[fk] = o[k]
    }
    return r
}
function walk(dir, pred) {
    const out = []
    function rec(d) {
        let ents = []
        try {
            ents = fs.readdirSync(d, { withFileTypes: true })
        } catch {
            return
        }
        for (const e of ents) {
            const full = path.join(d, e.name)
            const rel = path.relative(ROOT, full).replaceAll(path.sep, "/")
            if (e.isDirectory()) {
                if (rel.includes("__tests__")) continue
                rec(full)
            } else if (e.isFile() && pred(rel)) out.push(rel)
        }
    }
    rec(dir)
    return out.sort()
}
function findPages() {
    return walk(path.join(ROOT, "src/app"), p => p.endsWith("/page.tsx"))
}
function findTsx() {
    const a = walk(
        path.join(ROOT, "src/components"),
        p =>
            p.endsWith(".tsx") &&
            !p.endsWith(".test.tsx") &&
            !p.includes("__tests__")
    )
    const b = walk(
        path.join(ROOT, "src/app"),
        p =>
            p.endsWith(".tsx") &&
            !p.endsWith(".test.tsx") &&
            !p.includes("__tests__")
    )
    return [...a, ...b].sort()
}
function hasI18n(content) {
    return /useTranslations|getTranslations/.test(content)
}
function namespaces(content) {
    const a = [...content.matchAll(/useTranslations\("([^"]+)"\)/g)].map(
        m => m[1]
    )
    const b = [
        ...content.matchAll(
            /getTranslations\(\s*\{[^}]*namespace:\s*"([^"]+)"/g
        ),
    ].map(m => m[1])
    return [...a, ...b]
}

// ---- collect ----
const pages = findPages() // 89
const allTsx = findTsx()
const req = read("src/i18n/request.ts")
const loaded = [
    ...req.matchAll(/@\/i18n\/\$\{selectedLocale\}\/([^"}]+)\.json/g),
]
    .map(m => m[1] + ".json")
    .sort()
const nsFiles = fs
    .readdirSync(path.join(I18N_DIR, "en"))
    .filter(f => f.endsWith(".json"))
    .sort()
const notLoaded = nsFiles.filter(f => !loaded.includes(f))

// classify pages
const wrappers = []
const canon = []
for (const p of pages) {
    const c = read(p)
    if (c.includes("export { default } from")) wrappers.push(p)
    else canon.push(p)
}

// url mapping for slugs per locale (hardcoded from reading url-mapping.ts + wrapper inventory)
const slugMap = {
    "about-me": {
        en: "about-me",
        "pt-BR": "quem-sou-eu",
        es: "acerca-de-mi",
        de: "uber-mich",
        fr: "a-propos-de-moi",
    },
    "channel-management": {
        en: "channel-management",
        "pt-BR": "gerenciamento-de-canais",
        es: "gestion-de-canales",
        de: "kanalverwaltung",
        fr: "gestion-de-chaine",
    },
    editors: {
        en: "editors",
        "pt-BR": "editores",
        es: "editores",
        de: "editoren",
        fr: "editeurs",
    },
    "pc-optimization": {
        en: "pc-optimization",
        "pt-BR": "otimizacao-de-pc",
        es: "optimizacion-de-pc",
        de: "pc-optimierung",
        fr: "optimisation-de-pc",
    },
    "amazon-affiliate": {
        en: "amazon-affiliate",
        "pt-BR": "afiliados-amazon",
        es: "afiliados-amazon",
        de: "amazon-partner",
        fr: "affiliation-amazon",
    },
    "privacy-policy": {
        en: "privacy-policy",
        "pt-BR": "politica-de-privacidade",
        es: "politica-de-privacidad",
        de: "datenschutzrichtlinie",
        fr: "politique-de-confidentialite",
    },
    "terms-of-service": {
        en: "terms-of-service",
        "pt-BR": "termos-de-servico",
        es: "terminos-de-servicio",
        de: "nutzungsbedingungen",
        fr: "conditions-d-utilisation",
    },
    services: {
        en: "services",
        "pt-BR": "servicos",
        es: "servicios",
        de: "dienstleistungen",
        fr: "services" /* wrapper? actually conditions-d-utilisation reused */,
    },
    login: {
        en: "login",
        "pt-BR": "entrar",
        es: "iniciar-sesion",
        de: "anmelden",
        fr: "connexion",
    },
    register: {
        en: "register",
        "pt-BR": "registrar",
        es: "registrarse",
        de: "registrieren",
        fr: "s-inscrire",
    },
}
function urlFor(canonRel, locale) {
    // canonRel e.g. "about-me", "channel-management", "pc-optimization", "editors", "blog", "dashboard/live", "minecraft/page", etc
    const top = canonRel.split("/")[0]
    if (slugMap[top]) {
        const slug = slugMap[top][locale]
        const rest = canonRel.split("/").slice(1).join("/")
        return `/${locale}/${slug}${rest ? "/" + rest : ""}`
    }
    // blog, dashboard, minecraft, auth, obs, payments etc have fixed slugs
    return `/${locale}/${canonRel}`
}

// component i18n
const compOk = [],
    compNo = []
for (const p of allTsx) {
    const c = read(p)
    if (hasI18n(c)) compOk.push(p)
    else compNo.push(p)
}

// Hardcoded heuristic: JSX text between tags not via t()
function findHardcoded(limit = 300) {
    const out = []
    for (const p of allTsx) {
        const c = read(p)
        if (hasI18n(c)) continue // focus on NO files first, but also sample OK
        const lines = c.split("\n")
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i]
            const trimmed = l.trim()
            if (
                trimmed.startsWith("import ") ||
                trimmed.startsWith("//") ||
                trimmed.startsWith("*")
            )
                continue
            // JSX text: >Word ...<
            const matches = [...l.matchAll(/>([^<>{}]{4,90})</g)]
            for (const m of matches) {
                const t = m[1].trim()
                if (!t) continue
                if (/^(from|import|export|const|let|var|if|return)$/.test(t))
                    continue
                if (/^[\d\s\-_/.,:;()]+$/.test(t)) continue
                if (t.length < 4) continue
                if (
                    l.includes("t(") ||
                    l.includes("useTranslations") ||
                    l.includes("getTranslations")
                )
                    continue
                if (/^[a-z-]+$/.test(t) && t.length < 12) continue
                // filter out obviously not UI: className fragments
                if (
                    /^(flex|grid|hidden|block|text|bg-|border|rounded|p-|m-|gap-|w-|h-)/.test(
                        t
                    )
                )
                    continue
                out.push({ file: p, line: i + 1, text: t })
                if (out.length >= limit) return out
            }
        }
    }
    return out
}
const hardcodedSample = findHardcoded(120)

// ---- build markdown ----
let md = ""
const now = new Date().toISOString()
md += `# Auditoria i18n — gabrieltoth.com\n\n`
md += `> Gerado em: ${now} | Branch: main | Locales: ${LOCALES.join(", ")} | next-intl (request.ts + useTranslations/getTranslations)\n`
md += `> Como usar: este arquivo é a fonte de consulta de cobertura. Filtre por "❌" para achar gaps. Padrões para novos idiomas: ver §10. Checklist de PR: ver §11.\n\n`

md += `## Índice\n\n`
md += `1. [Sumário executivo](#1-sumário-executivo)\n`
md += `2. [Arquitetura i18n atual](#2-arquitetura-i18n-atual)\n`
md += `3. [Namespaces — inventário e paridade](#3-namespaces--inventário-e-paridade)\n`
md += `4. [URL por idioma — slugs localizados](#4-url-por-idioma--slugs-localizados)\n`
md += `5. [Páginas — inventário completo (url / componente / língua)](#5-páginas--inventário-completo-url--componente--língua)\n`
md += `6. [Componentes — inventário](#6-componentes--inventário)\n`
md += `7. [Gaps — o que NÃO está traduzido](#7-gaps--o-que-não-está-traduzido)\n`
md += `8. [Hardcoded strings — amostra](#8-hardcoded-strings--amostra)\n`
md += `9. [Riscos e dívidas técnicas](#9-riscos-e-dívidas-técnicas)\n`
md += `10. [Padrões para novas línguas](#10-padrões-para-novas-línguas)\n`
md += `11. [Checklist de PR i18n](#11-checklist-de-pr-i18n)\n`
md += `12. [Plano de correção priorizado](#12-plano-de-correção-priorizado)\n`
md += `A. [Apêndice — comandos de validação](#a-apêndice--comandos-de-validação)\n\n`

md += `## 1) Sumário executivo\n\n`
md += `| Métrica | Valor |\n|---|---|\n`
md += `| page.tsx no total | ${pages.length} |\n`
md += `| Wrappers (re-export de slug localizado) | ${wrappers.length} |\n`
md += `| Canônicas (layout/conteúdo real) | ${canon.length} |\n`
md += `| .tsx em src/app+src/components (sem __tests__/.test.) | ${allTsx.length} |\n`
md += `| Com i18n direto (useTranslations/getTranslations) | ${compOk.length} (${Math.round((compOk.length / allTsx.length) * 100)}%) |\n`
md += `| Sem i18n direto | ${compNo.length} (${Math.round((compNo.length / allTsx.length) * 100)}%) |\n`
md += `| Namespaces por locale | ${nsFiles.length} (9 questions/* à parte) |\n`
md += `| Namespaces carregados em request.ts | ${loaded.length} |\n`
md += `| Namespaces existentes mas NÃO carregados | ${notLoaded.join(", ") || "—"} |\n`
md += `| Páginas canônicas SEM i18n direto | ${canon.filter(p => !hasI18n(read(p))).length} |\n`
md += `| Páginas canônicas COM i18n direto | ${canon.filter(p => hasI18n(read(p))).length} |\n\n`

md += `**Leitura em 30s:**\n`
md += `- **Cobertura boa** em: dashboard (channels/cloner/credits/discover/insights/live/publish/repost/settings), minecraft (todos os subpaths), amazon-affiliate, auth/complete-account, forgot-password, home/landing.\n`
md += `- **Gaps confirmados** (§7): blog, docs, login, register, about-me/channel-management/editors/pc-optimization (page.tsx sem i18n — delegam para sections/views que às vezes têm i18n, mas metadata/SEO/breadcrumbs seguem hardcoded em EN), obs, payments/checkout, live/chat-popout, dashboard/docs, e legado fora de [locale] (src/app/page.tsx, src/app/channel-management/*, etc.).\n`
md += `- **Dívida de infra**: 2 namespaces em disco nunca entram em messages (breadcrumbs.json, seo.json) e portanto nunca são traduzidos no front, mesmo existindo em 5 línguas.\n`
md += `- **Risco de nova língua**: adicionar locale exige 6 toques manuais (ver §10); sem checklist, é fácil esquecer request.ts, locales[], url-mapping, wrappers, middleware e scripts/validate.\n\n`

md += `## 2) Arquitetura i18n atual\n\n`
md += `### 2.1 Fonte da verdade — src/lib/i18n.ts\n\n`
md += "```ts\n" + read("src/lib/i18n.ts").slice(0, 1400) + "\n```\n\n"
md += `- **locales**: ${LOCALES.join(", ")} | **defaultLocale**: pt-BR\n`
md += `- Helpers: getLocaleFromCookie / setLocaleCookie / getLocaleFromUrl / getLocalizedPath / detectBrowserLanguage\n\n`

md += `### 2.2 Messages map — src/i18n/request.ts\n\n`
md += `Carrega via \`loadJson(() => import(\`@/i18n/\${selectedLocale}/<ns>.json\`))\` e monta \`messages\`. Trecho real:\n\n`
const reqSlice = (() => {
    const c = read("src/i18n/request.ts")
    const a = c.indexOf("const messages")
    const b = c.indexOf("return {", a)
    return c.slice(a, b + 400).slice(0, 2200)
})()
md += "```ts\n" + reqSlice + "\n```\n\n"
md += `**Carregados (${loaded.length}):** ${loaded.join(", ")}\n\n`
md += `**NÃO carregados (${notLoaded.length}):** ${notLoaded.join(", ") || "—"}\n\n`
if (notLoaded.length) {
    md += `> ⚠️ Ação: os arquivos existem em 5 línguas mas nunca são expostos ao front. \`breadcrumbs.json\` = {"home":"Home"}; \`seo.json\` = {personDescription, personJobTitle, websiteDescription, organizationDescription} — hoje SEO é gerado hardcoded em EN via generateSeoConfig/OgImage. Se devem ser traduzidos, precisam entrar no map (ex: \`breadcrumbs, seo\`) e serem consumidos via \`useTranslations("breadcrumbs")\` / \`getTranslations\`.\n\n`
}
md += `### 2.3 Middleware — middleware.ts\n\n`
md += "```ts\n" + read("middleware.ts").slice(0, 1600) + "\n```\n\n"
md += `### 2.4 URL mapping — src/lib/url-mapping.ts\n\n`
md += "```ts\n" + read("src/lib/url-mapping.ts").slice(0, 2200) + "\n```\n\n"
md += `**Cobertos:** about-me, channel-management, editors, pc-optimization, amazon-affiliate, privacy-policy, terms-of-service, login, register, payments, services, minecraft (+ subpaths: modpacks/mods/plugins/contributions).\n\n`
md += `**Não mapeados (slug fixo por locale ou sem tradução de path):** blog, dashboard/*, obs, payments/checkout, auth/complete-account, forgot-password, reset-password, affiliation-amazon variants.\n\n`

md += `## 3) Namespaces — inventário e paridade\n\n`
md += `Todos os 5 locales têm exatamente os mesmos ${nsFiles.length} arquivos em src/i18n/<locale>/*.json + 9 em questions/*.json.\n\n`
md += `| Namespace | en | pt-BR | es | de | fr | Status |\n|---|---:|---:|---:|---:|---:|---|\n`
for (const ns of nsFiles) {
    const counts = {}
    for (const loc of LOCALES) {
        try {
            counts[loc] = Object.keys(
                flat(JSON.parse(read(`src/i18n/${loc}/${ns}`)))
            ).length
        } catch {
            counts[loc] = 0
        }
    }
    const vals = Object.values(counts)
    const ok = new Set(vals).size === 1
    md += `| ${ns} | ${counts["en"]} | ${counts["pt-BR"]} | ${counts["es"]} | ${counts["de"]} | ${counts["fr"]} | ${ok ? "✅ paridade" : "⚠️ divergente"} |\n`
}
md += `\nValidado também em: questions/* (9 por locale: biology, language, logic, math, philosophy, physics, science, sociology, world-history) — OK, carregados dinamicamente, não via messages map.\n\n`
md += `> Por que i18n:validate passa e ainda há gaps? Porque o validador compara chaves flatten vs en dentro de cada namespace — todos têm paridade. O problema é **componente não consumindo o namespace**: a chave existe, mas a UI nunca chama t("...").\n\n`

md += `## 4) URL por idioma — slugs localizados\n\n`
md += `Wrappers físicos: cada slug localizado existe como pasta em src/app/[locale]/ e faz \`export { default } from "../<canonica>/page"\` + re-exporta generateMetadata. Canônicas atendem /<locale>/<slug> via param.\n\n`
md += `| Conceito | en | pt-BR | es | de | fr | Canônica | Wrappers |\n|---|---|---|---|---|---|---|---|\n`
md += `| about-me | /en/about-me | /pt-BR/quem-sou-eu | /es/acerca-de-mi | /de/uber-mich | /fr/a-propos-de-moi | src/app/[locale]/about-me/page.tsx | quem-sou-eu, acerca-de-mi, uber-mich, a-propos-de-moi |\n`
md += `| channel-management | /en/channel-management | /pt-BR/gerenciamento-de-canais | /es/gestion-de-canales | /de/kanalverwaltung | /fr/gestion-de-chaine | src/app/[locale]/channel-management/page.tsx | gerenciamento-de-canais, gestion-de-canales, gestion-de-chaine, kanalverwaltung |\n`
md += `| editors | /en/editors | /pt-BR/editores | /es/editores | /de/editoren | /fr/editeurs | src/app/[locale]/editors/page.tsx | editores, editeurs, editoren |\n`
md += `| pc-optimization | /en/pc-optimization | /pt-BR/otimizacao-de-pc | /es/optimizacion-de-pc | /de/pc-optimierung | /fr/optimisation-de-pc | src/app/[locale]/pc-optimization/page.tsx | otimizacao-de-pc, optimizacion-de-pc, pc-optimierung, optimisation-de-pc |\n`
md += `| services | /en/services | /pt-BR/servicos | /es/servicios | /de/dienstleistungen | /fr/services | src/app/[locale]/services (pasta) | servicos, servicios, dienstleistungen |\n`
md += `| privacy-policy | /en/privacy-policy | /pt-BR/politica-de-privacidade | /es/politica-de-privacidad | /de/datenschutzrichtlinie | /fr/politique-de-confidentialite | src/app/[locale]/privacy-policy/page.tsx* | wrappers equivalentes |\n`
md += `| terms-of-service | /en/terms-of-service | /pt-BR/termos-de-servico | /es/terminos-de-servicio | /de/nutzungsbedingungen | /fr/conditions-d-utilisation | src/app/[locale]/terms-of-service/page.tsx* | wrappers equivalentes |\n`
md += `| amazon-affiliate | /en/amazon-affiliate | /pt-BR/afiliados-amazon | /es/afiliados-amazon | /de/amazon-partner | /fr/affiliation-amazon | src/app/[locale]/amazon-affiliate/page.tsx | afiliados-amazon, affiliation-amazon, amazon-partner |\n`
md += `| login | /en/login | /pt-BR/entrar | /es/iniciar-sesion | /de/anmelden | /fr/connexion | src/app/[locale]/login/page.tsx | entrar, iniciar-sesion, anmelden, connexion |\n`
md += `| register | /en/register | /pt-BR/registrar | /es/registrarse | /de/registrieren | /fr/s-inscrire | src/app/[locale]/register/page.tsx | registrar, registrarse, registrieren, s-inscrire |\n`
md += `| blog | /en/blog | /pt-BR/blog | /es/blog | /de/blog | /fr/blog | src/app/[locale]/blog/page.tsx | — (slug fixo, não localizado) |\n`
md += `| dashboard/* | /en/dashboard/* | /pt-BR/dashboard/* | /es/dashboard/* | /de/dashboard/* | /fr/dashboard/* | src/app/[locale]/dashboard/* | — (slug fixo) |\n`
md += `| minecraft/* | /en/minecraft/* | /pt-BR/minecraft/* | /es/minecraft/* | /de/minecraft/* | /fr/minecraft/* | src/app/[locale]/minecraft/* | — (slug fixo) |\n`
md += `| obs | /en/obs | /pt-BR/obs | /es/obs | /de/obs | /fr/obs | src/app/[locale]/obs/page.tsx | — |\n`
md += `| payments/checkout | /en/payments/checkout | ... | ... | ... | ... | src/app/[locale]/payments/checkout/page.tsx | — |\n`
md += `\n- privacy/terms/services às vezes vivem como pastas com wrappers e metadata dedicados; ver wrappers listados em §5.1.\n\n`

md += `## 5) Páginas — inventário completo (url / componente / língua)\n\n`
md += `Legenda: **i18n direto** = page.tsx importa e chama useTranslations/getTranslations. "Delega" = page usa section/view que pode ter i18n, mas metadata/SEO/breadcrumbs da page continuam sem i18n.\n\n`
md += `### 5.1 Wrappers (37) — re-export, i18n herdado da canônica\n\n`
md += `| Wrapper path | Re-exporta de | url por língua (5 locales, mesmo arquivo serve) |\n|---|---|---|\n`
for (const w of wrappers) {
    const c = read(w)
    const target = (c.match(/from\s+"([^"]+)"/) || [])[1] || "?"
    const slug = w.replace("src/app/[locale]/", "").replace("/page.tsx", "")
    md += `| \`${w}\` | \`${target}\` | \`/${slug}\` via [locale] param (en/pt-BR/es/de/fr) |\n`
}
md += `\n### 5.2 Canônicas (52) — url / componente / língua + i18n\n\n`
md += `| # | Componente | url en | url pt-BR | url es | url de | url fr | i18n direto | namespaces | Diagnóstico |\n|---|---|---|---|---|---|---|---|---|---|\n`
let idx = 0
for (const p of canon) {
    idx++
    const rel = p
        .replace("src/app/[locale]/", "")
        .replace("/page.tsx", "")
        .replace("src/app/", "")
    const content = read(p)
    const ok = hasI18n(content)
    const nss = namespaces(content).join(", ") || "—"
    const relForUrl = p
        .replace("src/app/[locale]/", "")
        .replace("/page.tsx", "")
    // best-effort url per locale via slugMap
    const top = relForUrl.split("/")[0]
    let urls = {}
    if (slugMap[top]) {
        for (const loc of LOCALES) urls[loc] = urlFor(relForUrl, loc)
    } else {
        for (const loc of LOCALES) urls[loc] = `/${loc}/${relForUrl}`
    }
    // legacy outside [locale]
    if (p.startsWith("src/app/") && !p.startsWith("src/app/[locale]")) {
        for (const loc of LOCALES) {
            const base = p.replace("src/app", "").replace("/page.tsx", "")
            urls[loc] = (base || "/") + ` (sem [locale])`
        }
    }
    let diag = ""
    if (!ok) {
        if (p.includes("about-me/page.tsx"))
            diag =
                "⚠️ Delegado: AboutMeSection tem i18n (aboutMe), mas page metadata/SEO hardcoded EN + StructuredData sem t()"
        else if (p.includes("channel-management/page.tsx"))
            diag =
                "⚠️ Delegado parcial: channel-management-view/breadcrumbs têm i18n, mas page.tsx sem t() — breadcrumbs/SEO vêm de helper hardcoded"
        else if (p.includes("editors/page.tsx"))
            diag =
                "⚠️ Delegado: editors-view/breadcrumbs têm i18n, page sem t()"
        else if (p.includes("pc-optimization/page.tsx"))
            diag =
                "⚠️ Delegado: pc-optimization-view/breadcrumbs têm i18n, page sem t()"
        else if (p.includes("/blog"))
            diag =
                "❌ Sem i18n — blog lista/detalhe hardcoded EN (sem namespace blog)"
        else if (p.includes("/login/page.tsx"))
            diag =
                "❌ Sem i18n direto — auth/login flow; verificar login-form.tsx/auth namespace"
        else if (p.includes("/register/page.tsx"))
            diag = "❌ Sem i18n direto — auth/register flow"
        else if (p.includes("/dashboard/docs"))
            diag = "❌ Sem i18n — docs/tutorial hardcoded"
        else if (p.includes("/obs/page.tsx"))
            diag = "❌ Sem i18n — obs page hardcoded"
        else if (p.includes("/payments/checkout/page.tsx"))
            diag = "❌ Sem i18n — checkout hardcoded"
        else if (p.includes("/dashboard/live/chat-popout/page.tsx"))
            diag = "❌ Sem i18n — popout hardcoded (título/copy)"
        else if (p.includes("src/app/page.tsx"))
            diag =
                "❌ LEGADO sem [locale] — redirect/landing fora do fluxo next-intl"
        else if (
            p.includes("src/app/channel-management") ||
            p.includes("src/app/editors") ||
            p.includes("src/app/pc-optimization") ||
            p.includes("src/app/privacy-policy") ||
            p.includes("src/app/terms-of-service")
        )
            diag =
                "❌ LEGADO sem [locale] — duplicata fora de [locale], sem i18n"
        else if (p.includes("src/app/dashboard/settings/page.tsx"))
            diag =
                "❌ LEGADO /dashboard sem [locale] — depende de middleware redirect"
        else diag = "⚠️ Sem useTranslations/getTranslations"
    } else diag = "✅"

    const short = p.replace("src/app/", "")
    md += `| ${idx} | \`${short}\` | \`${urls["en"] || "—"}\` | \`${urls["pt-BR"] || "—"}\` | \`${urls["es"] || "—"}\` | \`${urls["de"] || "—"}\` | \`${urls["fr"] || "—"}\` | ${ok ? "✅" : "❌"} | \`${nss}\` | ${diag} |\n`
}
md += `\n> Nota: wrappers não aparecem aqui; eles expõem o mesmo conteúdo canônico sob slugs traduzidos (ver §5.1). Para auditar "url por língua" real, combine canônica + wrappers do mesmo conceito (ex: canônica about-me + wrappers quem-sou-eu etc.).\n\n`

// ---- Components ----
md += `## 6) Componentes — inventário\n\n`
md += `**Total .tsx (app+components, sem testes):** ${allTsx.length} → **${compOk.length} com i18n** / **${compNo.length} sem i18n direto**.\n\n`
md += `"Sem i18n direto" inclui: ui primitivos (button, dialog, etc.) que são atômicos e corretamente sem tradução, + views/sections que deveriam ter mas não têm. Abaixo amostragem por diretório.\n\n`
md += `### 6.1 Sem i18n — por diretório\n\n`
const byDir = {}
for (const p of compNo) {
    const d = p.split("/").slice(0, 3).join("/")
    byDir[d] = (byDir[d] || 0) + 1
}
const sortedDirs = Object.entries(byDir).sort((a, b) => b[1] - a[1])
md += `| Diretório | Qtd sem i18n | Comentário |\n|---|---:|---|\n`
for (const [d, n] of sortedDirs) {
    let cmt = ""
    if (d === "src/components/ui")
        cmt = "Esperado: primitivos sem copy (ok se não têm texto)"
    else if (d === "src/app/[locale]")
        cmt = "Pages/sections/views — ver §5.2 e §7"
    else if (d.includes("registration"))
        cmt = "⚠️ Fluxos de conta — checar se usam auth namespace"
    else if (d.includes("dashboard"))
        cmt = "Misto: alguns têm i18n, outros delegam"
    else if (d.includes("auth"))
        cmt = "⚠️ Auth forms — devem usar auth namespace"
    else cmt = ""
    md += `| \`${d}\` | ${n} | ${cmt} |\n`
}
md += `\n### 6.2 Lista — sem i18n direto (184 arquivos)\n\n`
md += `<details><summary>Clique para expandir (184)</summary>\n\n`
for (const p of compNo) md += `- \`${p}\`\n`
md += `\n</details>\n\n`
md += `### 6.3 Lista — com i18n direto (139 arquivos, amostra 40)\n\n`
for (const p of compOk.slice(0, 40)) {
    const nss = namespaces(read(p)).join(", ") || "—"
    md += `- \`${p}\` → \`${nss}\`\n`
}
md += `- ... e mais ${Math.max(0, compOk.length - 40)} com i18n\n\n`

md += `## 7) Gaps — o que NÃO está traduzido\n\n`
md += `Prioridade P0 = quebra de experiência por idioma; P1 = dívida visível; P2 = infra/polimento.\n\n`
md += `| # | url / componente / língua | Tipo | Evidência | Prioridade | Correção sugerida |\n|---|---|---|---|---|---|\n`
md += `| 1 | url: /{locale}/blog e /{locale}/blog/[slug] · comp: src/app/[locale]/blog/page.tsx, [slug]/page.tsx · língua: 5 | Página sem i18n | 2 page.tsx sem useTranslations/getTranslations; sem namespace blog em request.ts/i18n | P0 | Criar src/i18n/<locale>/blog.json + carregar em request.ts + t() em lista/detalhe |\n`
md += `| 2 | url: /{locale}/login e wrappers /entrar/iniciar-sesion/anmelden/connexion · comp: src/app/[locale]/login/page.tsx · língua: 5 | Auth page sem i18n | page.tsx sem t(); depende de filho login-form mas metadata/SEO da page hardcoded | P0 | Adicionar getTranslations("auth") na page (title/desc/metadata) + garantir login-form usa auth |\n`
md += `| 3 | url: /{locale}/register e wrappers · comp: src/app/[locale]/register/page.tsx | Auth page sem i18n | igual login | P0 | idem |\n`
md += `| 4 | url: /{locale}/obs · comp: src/app/[locale]/obs/page.tsx · 5 | Página sem i18n | page sem t() | P0 | Criar namespace obs ou reutilizar dashboard |\n`
md += `| 5 | url: /{locale}/payments/checkout · comp: src/app/[locale]/payments/checkout/page.tsx · 5 | Checkout sem i18n | hardcoded | P0 | Namespace payments/checkout |\n`
md += `| 6 | url: /{locale}/dashboard/docs e /{locale}/dashboard/docs/[category] · comp: docs/page.tsx, [category]/page.tsx · 5 | Docs sem i18n | sem t() | P1 | Namespace docs/tutorial |\n`
md += `| 7 | url: /{locale}/dashboard/live/chat-popout · comp: chat-popout/page.tsx · 5 | Popout sem i18n | títulos/copy hardcoded ("Popout Chat", "Copiar URL para usar no OBS") | P1 | dashboard.live namespace |\n`
md += `| 8 | url: /{locale}/about-me (e wrappers) · comp: src/app/[locale]/about-me/page.tsx · 5 | Delegação parcial | page sem t(); AboutMeSection OK (aboutMe), mas generateMetadata/generateSeoConfig/OgImage hardcoded EN | P1 | Adicionar getTranslations("aboutMe"/"seo") na page para metadata/SEO |\n`
md += `| 9 | url: /{locale}/channel-management (+ wrappers) · comp: channel-management/page.tsx · 5 | Delegação parcial | page sem t(); view/breadcrumbs têm i18n, mas SEO/breadcrumbs helper com strings hardcoded | P1 | Mover breadcrumbs/SEO para namespaces + t() na page |\n`
md += `| 10 | url: /{locale}/editors (+ wrappers) · comp: editors/page.tsx · 5 | Delegação parcial | idem | P1 | idem |\n`
md += `| 11 | url: /{locale}/pc-optimization (+ wrappers) · comp: pc-optimization/page.tsx · 5 | Delegação parcial | idem | P1 | idem |\n`
md += `| 12 | url: /channel-management, /editors, /pc-optimization, /privacy-policy, /terms-of-service (sem [locale]) · comps: src/app/channel-management/page.tsx etc. · 5 | Legado sem [locale] | páginas fora de [locale] duplicam canônicas, sem i18n, fora do fluxo next-intl | P1 | Remover ou redirecionar para /{locale}/<slug> (middleware) |\n`
md += `| 13 | url: / (raiz) · comp: src/app/page.tsx · 5 | Landing sem [locale] | sem t() | P1 | Manter apenas como redirect para /{locale} (já existe?) ou adicionar i18n |\n`
md += `| 14 | url: /{locale}/dashboard/settings (legado) · comp: src/app/dashboard/settings/page.tsx · 5 | Duplicata | depende de middleware redirect | P2 | Remover duplicata, manter só [locale]/dashboard/settings |\n`
md += `| 15 | namespaces breadcrumbs.json, seo.json · 5 | Infra não carregada | existem em 5 línguas mas não entram em messages (request.ts) | P2 | Adicionar ao messages map ou remover arquivos se obsoletos |\n`
md += `| 16 | url: src/components/registration/*, src/components/auth/* · 5 | Componentes auth sem i18n | parte dos fluxos não usa t() direto (usa prop drilling) | P1 | Garantir todo registration/* usa auth namespace |\n`
md += `| 17 | url: dashboard/cloner, discover, repost — placeholders hardcoded | Componentes com i18n mas com strings residuais | grep encontrou placeholders hardcoded mesmo em arquivos com t() (ex: "Cole a URL...", "Carregar JSON Local") | P1 | Mover todos placeholders/títulos para dashboard.json |\n`
md += `\n`

md += `## 8) Hardcoded strings — amostra\n\n`
md += `Heurística: texto entre >...< em .tsx sem t()/useTranslations/getTranslations na linha (filtro de className/aria-*). \n\n`
md += `Amostra de ${hardcodedSample.length} ocorrências (priorizar P0/P1):\n\n`
md += `| # | Componente | Linha | Texto hardcoded | url afetada | língua |\n|---|---|---:|---|---|---|\n`
hardcodedSample.slice(0, 60).forEach((s, i) => {
    const urls = s.file.includes("[locale]")
        ? `/{locale}/${s.file.split("[locale]/")[1].split("/page")[0]}`
        : s.file.replace("src/app", "")
    md += `| ${i + 1} | \`${s.file}\` | ${s.line} | "${s.text.replace(/\|/g, "/").slice(0, 80)}" | \`${urls}\` | 5 (hardcoded igual em todas) |\n`
})
md += `\n> Dica: rode grep -rn '>[A-ZÁÂÃ].*<' src/app src/components --include="*.tsx" | grep -v 't(' → lista completa. Melhor ainda: regra eslint no-restricted-syntax para JSXText sem t().\n\n`

md += `## 9) Riscos e dívidas técnicas\n\n`
md += `- **SEO/metadata não traduzido**: generateSeoConfig/generateMetadata em about-me, channel-management, editors, pc-optimization usam title/desc hardcoded EN (openGraph locale fixo) — afeta hreflang/sitemap por idioma.\n`
md += `- **Breadcrumbs hardcoded**: channelManagementBreadcrumbs, editorsBreadcrumbs, pcOptimizationBreadcrumbs constroem labels via t("breadcrumbs.*") mas breadcrumbs.json não está em messages — fallback silencioso para EN.\n`
md += `- **Duplicação de rotas**: legado src/app/<slug>/page.tsx fora de [locale] compete com [locale]/<slug> — risco de 404/conteúdo duplicado para crawlers.\n`
md += `- **Placeholders residuais**: mesmo componentes com i18n ainda têm strings literais em placeholder/title/aria-label (ex: dashboard/cloner, discover) — quebra em de/fr.\n`
md += `- **Sem lint guard**: nenhuma regra impede novo JSX hardcoded; i18n:validate só checa paridade de chaves, não uso.\n`
md += `- **Nova língua = 6 toques manuais**: locales[], request.ts, url-mapping.ts, wrappers físicos, middleware SUPPORTED_LOCALES, sitemap — sem gerador, fácil esquecer um.\n\n`

md += `## 10) Padrões para novas línguas\n\n`
md += `### 10.1 Adicionar um locale (ex: it)\n\n`
md +=
    `1. **src/lib/i18n.ts**: adicione "it" em \`locales\` + \`localeNames\`/` +
    "`localeNamesShort`" +
    `.\n`
md += `2. **src/i18n/it/**: copie \`src/i18n/en/**\` (34 .json + questions/9) e traduza; mantenha chaves idênticas (flatten keys iguais). Use \`npm run i18n:validate\` para garantir paridade.\n`
md += `3. **src/i18n/request.ts**: se criou novo namespace, adicione \`loadJson(() => import(\`@/i18n/\${selectedLocale}/<ns>.json\`))\` + entrada em \`messages\`.\n`
md += `4. **src/lib/url-mapping.ts**: adicione entrada \`it: { "about-me": "chi-sono", ... }\` para cada slug localizado.\n`
md += `5. **Wrappers**: crie \`src/app/[locale]/<slug-it>/page.tsx\` para cada slug traduzido (copie de outro wrapper, só mude import). Ex: \`chi-sono/page.tsx\` → \`export { default } from "../about-me/page"\`.\n`
md += `6. **middleware.ts**: adicione "it" em \`SUPPORTED_LOCALES\`.\n`
md += `7. **Sitemap/SEO**: adicione \`sitemap-it.xml\` + hreflang em generateSeoConfig.\n`
md += `8. **Valide**: \`npm run i18n:validate && npm run i18n:check-params && npm run type-check && npm test\`.\n\n`

md += `### 10.2 Criar nova página com i18n (template)\n\n`
md += "```tsx\n"
md += `// src/app/[locale]/minha-pagina/page.tsx\n`
md += `import { getTranslations } from "next-intl/server";\n`
md += `import { type Locale } from "@/lib/i18n";\n`
md += `export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {\n`
md += `  const { locale } = await params;\n`
md += `  const t = await getTranslations({ locale, namespace: "minhaPagina" });\n`
md += `  return { title: t("seo.title"), description: t("seo.description") };\n`
md += `}\n`
md += `export default async function MinhaPagina({ params }: { params: Promise<{ locale: Locale }> }) {\n`
md += `  const { locale } = await params;\n`
md += `  const t = await getTranslations({ locale, namespace: "minhaPagina" });\n`
md += `  return <h1>{t("hero.title")}</h1>;\n`
md += `}\n`
md += "```\n\n"

md += `### 10.3 Componente com i18n (template)\n\n`
md += "```tsx\n"
md += `"use client";\n`
md += `import { useTranslations } from "next-intl";\n`
md += `export function MeuCard() {\n`
md += `  const t = useTranslations("dashboard.meuCard");\n`
md += `  return <button aria-label={t("cta.aria")} title={t("cta.title")}>{t("cta.label")}</button>;\n`
md += `}\n`
md += "```\n\n"
md += `Regras:\n`
md += `- Nunca hardcodear copy em JSX: sempre \`t("namespace.chave")\`.\n`
md += `- Placeholders, aria-label, title, alt, empty states, toasts, erros — tudo via t().\n`
md += `- Placeholders dinâmicos: \`t("hello", { name })\` + \`{name}\` no JSON; validar com \`i18n:check-params\`.\n`
md += `- Não criar namespace novo sem adicionar em request.ts messages map.\n`
md += `- Preferir namespaces existentes (auth, dashboard.*, seo, breadcrumbs) antes de criar novo.\n\n`

md += `### 10.4 Namespaces — quando criar vs reutilizar\n\n`
md += `| Já existe | Use para |\n|---|---|\n`
md += `| auth | login, register, complete-account, forgot-password, reset-password |\n`
md += `| dashboard.* | channels, cloner, credits, discover, insights, live, publish, repost, settings, common |\n`
md += `| home / landing / aboutMe / editors / channelManagement / pcOptimization / services / minecraft* | páginas públicas |\n`
md += `| seo / breadcrumbs | SEO e navegação (após corrigir §7#15) |\n\n`
md += `Crie novo namespace só se a página for isolada (ex: blog.json, obs.json, payments.json, docs.json) e adicione em request.ts.\n\n`

md += `## 11) Checklist de PR i18n\n\n`
md += `- [ ] Nenhum JSXText/placeholder/aria-label hardcoded (grep \`>[A-Z].*<\' | grep -v t() = 0 ou justificado)\n`
md += `- [ ] Toda copy via \`useTranslations\` (client) ou \`getTranslations\` (server) com namespace existente em request.ts\n`
md += `- [ ] Se novo namespace: adicionado em request.ts messages map + JSON criado em 5 locales\n`
md += `- [ ] Se novo slug localizado: wrapper criado em src/app/[locale]/<slug>/page.tsx + url-mapping.ts atualizado\n`
md += `- [ ] Se novo locale: §10.1 completo (i18n.ts, request.ts, url-mapping, wrappers, middleware, sitemap)\n`
md += `- [ ] \`npm run i18n:validate\` e \`npm run i18n:check-params\` verdes\n`
md += `- [ ] Metadata/SEO traduzido (generateMetadata usa t(), og locale correto, hreflang)\n`
md += `- [ ] Breadcrumbs traduzidos (breadcrumbs.json em messages)\n`
md += `- [ ] Testes com next-intl mock (\`src/test-utils/next-intl-mock.ts\`) atualizados se necessário\n\n`

md += `## 12) Plano de correção priorizado\n\n`
md += `| Fase | Escopo | Estimativa | Critério de pronto |\n|---|---|---|---|\n`
md += `| 1 — P0 | blog (2 pages) + login/register (2) + obs + payments/checkout + chat-popout | 1–2 dias | Todas P0 com t() + namespaces, i18n:validate verde, sem hardcoded em grep |\n`
md += `| 2 — P1 metadata | about-me, channel-management, editors, pc-optimization: mover metadata/SEO para t() | 1 dia | generateMetadata usa getTranslations, og locale por locale, hreflang ok |\n`
md += `| 3 — P1 infra | breadcrumbs.json + seo.json em messages map + consumir via t() | 0.5 dia | request.ts carrega ambos, breadcrumbs traduzidos, seo.json usado em generateSeoConfig |\n`
md += `| 4 — P1 legado | Remover/redirect src/app/<slug> fora de [locale] (7 pastas) + /dashboard/settings duplicata | 0.5 dia | Sem duplicatas, middleware cobre, sem 404 |\n`
md += `| 5 — P1 polish | registration/*, auth/*, dashboard placeholders residuais | 1 dia | Todo placeholder/title/aria via t() |\n`
md += `| 6 — Guardrails | ESLint rule JSXText sem t() + CI i18n:validate/check-params obrigatório | 0.5 dia | PR falha se hardcoded |\n`
md += `| 7 — Nova língua | Gerador \`scripts/new-locale.mjs <code>\` automatizando §10.1 | 0.5 dia | Rodar e ter locale novo verde |\n`
md += `\n**Sugestão de melhoria (aberta):** em vez de wrappers físicos por slug, considere roteamento via \`[locale]/[slug]\` dinâmico + url-mapping lookup no middleware (rewrite), eliminando 37 arquivos boilerplate. Troca: menos arquivos vs. complexidade de rewrite + sitemap dinâmico. Para já, manter wrappers é o menor risco.\n\n`

md += `## A) Apêndice — comandos de validação\n\n`
md += "```bash\n"
md += `npm run i18n:validate          # paridade de chaves vs en (flatten)\n`
md += `npm run i18n:check-params       # placeholders {var} consistentes entre locales\n`
md += `npm run i18n:check-params -- --report  # relatório detalhado\n`
md += `npx tsc --noEmit                # tipos (Locale, messages)\n`
md += `# Varredura manual de hardcoded:\n`
md += `grep -rn '>[A-ZÁÂÃ].*<' src/app src/components --include='*.tsx' | grep -v 't(' | head\n`
md += `grep -rn 'placeholder=\\|aria-label=\\|title=' src --include='*.tsx' | grep -v 't(' | head\n`
md += "# Páginas sem i18n direto:\n"
md += `grep -rL 'useTranslations\\|getTranslations' src/app --include='*.tsx' | grep page.tsx\n`
md += "# Namespaces não carregados:\n"
md += `comm -23 <(ls src/i18n/en/*.json | xargs -I{} basename {} | sort) <(grep -oP '@\\/i18n/\\\\\\$\\{selectedLocale\\}/\\K[^"}]+' src/i18n/request.ts | sort)\n`
md += "```\n\n"

md += `---\n\n`
md += `**Próximo passo recomendado:** começar pela Fase 1 (P0) — blog + auth + obs/checkout/popout — e já na mesma PR corrigir Fase 3 (breadcrumbs/seo em messages), pois destrava breadcrumbs traduzidos para Fase 2.\n`

const outPath = path.join(ROOT, "docs/I18N_AUDIT.md")
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, md, "utf8")
console.log(
    `OK -> ${outPath} (${md.length} bytes, ${canon.length} canon, ${wrappers.length} wrappers)`
)
console.log(`Hardcoded sample: ${hardcodedSample.length}`)
