# Auditoria i18n — gabrieltoth.com

> Gerado em: 2026-08-31T12:48:56.884Z | Branch: main | Locales: en, pt-BR, es, de, fr | next-intl (request.ts + useTranslations/getTranslations)
> Como usar: este arquivo é a fonte de consulta de cobertura. Filtre por "❌" para achar gaps. Padrões para novos idiomas: ver §10. Checklist de PR: ver §11.

## Índice

1. [Sumário executivo](#1-sumário-executivo)
2. [Arquitetura i18n atual](#2-arquitetura-i18n-atual)
3. [Namespaces — inventário e paridade](#3-namespaces--inventário-e-paridade)
4. [URL por idioma — slugs localizados](#4-url-por-idioma--slugs-localizados)
5. [Páginas — inventário completo (url / componente / língua)](#5-páginas--inventário-completo-url--componente--língua)
6. [Componentes — inventário](#6-componentes--inventário)
7. [Gaps — o que NÃO está traduzido](#7-gaps--o-que-não-está-traduzido)
8. [Hardcoded strings — amostra](#8-hardcoded-strings--amostra)
9. [Riscos e dívidas técnicas](#9-riscos-e-dívidas-técnicas)
10. [Padrões para novas línguas](#10-padrões-para-novas-línguas)
11. [Checklist de PR i18n](#11-checklist-de-pr-i18n)
12. [Plano de correção priorizado](#12-plano-de-correção-priorizado)
A. [Apêndice — comandos de validação](#a-apêndice--comandos-de-validação)

## 1) Sumário executivo

| Métrica | Valor |
|---|---|
| page.tsx no total | 89 |
| Wrappers (re-export de slug localizado) | 37 |
| Canônicas (layout/conteúdo real) | 52 |
| .tsx em src/app+src/components (sem __tests__/.test.) | 323 |
| Com i18n direto (useTranslations/getTranslations) | 144 (45%) |
| Sem i18n direto | 179 (55%) |
| Namespaces por locale | 36 (9 questions/* à parte) |
| Namespaces carregados em request.ts | 34 |
| Namespaces existentes mas NÃO carregados | breadcrumbs.json, seo.json |
| Páginas canônicas SEM i18n direto | 15 |
| Páginas canônicas COM i18n direto | 37 |

**Leitura em 30s:**
- **Cobertura boa** em: dashboard (channels/cloner/credits/discover/insights/live/publish/repost/settings), minecraft (todos os subpaths), amazon-affiliate, auth/complete-account, forgot-password, home/landing.
- **Gaps confirmados** (§7): blog, docs, login, register, about-me/channel-management/editors/pc-optimization (page.tsx sem i18n — delegam para sections/views que às vezes têm i18n, mas metadata/SEO/breadcrumbs seguem hardcoded em EN), obs, payments/checkout, live/chat-popout, dashboard/docs, e legado fora de [locale] (src/app/page.tsx, src/app/channel-management/*, etc.).
- **Dívida de infra**: 2 namespaces em disco nunca entram em messages (breadcrumbs.json, seo.json) e portanto nunca são traduzidos no front, mesmo existindo em 5 línguas.
- **Risco de nova língua**: adicionar locale exige 6 toques manuais (ver §10); sem checklist, é fácil esquecer request.ts, locales[], url-mapping, wrappers, middleware e scripts/validate.

## 2) Arquitetura i18n atual

### 2.1 Fonte da verdade — src/lib/i18n.ts

```ts
export const locales = ["en", "pt-BR", "es", "de", "fr"] as const

export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
    en: "English",
    "pt-BR": "Português",
    /* cspell:disable-next-line */
    es: "Español",
    /* cspell:disable-next-line */
    de: "Deutsch",
    /* cspell:disable-next-line */
    fr: "Français",
}

// Short versions for language selector to avoid text overflow
export const localeNamesShort: Record<Locale, string> = {
    en: "EN",
    "pt-BR": "PT",
    es: "ES",
    de: "DE",
    fr: "FR",
}

export const defaultLocale: Locale = "pt-BR"

// Get locale from cookie (client-side)
export const getLocaleFromCookie = (): Locale => {
    /* c8 ignore next */
    if (typeof window === "undefined") return defaultLocale

    const cookieLocale = document.cookie
        .split("; ")
        .find(row => row.startsWith("locale="))
        ?.split("=")[1]

    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
        return cookieLocale as Locale
    }

    return defaultLocale
}

// Set locale cookie (client-side)
export const setLocaleCookie = (locale: Locale): void => {
    /* c8 ignore next */
    if (typeof window === "undefined") return

    const cookieString = `locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=lax`
    document.cookie = cookieString
}

// Get locale from URL 
```

- **locales**: en, pt-BR, es, de, fr | **defaultLocale**: pt-BR
- Helpers: getLocaleFromCookie / setLocaleCookie / getLocaleFromUrl / getLocalizedPath / detectBrowserLanguage

### 2.2 Messages map — src/i18n/request.ts

Carrega via `loadJson(() => import(`@/i18n/${selectedLocale}/<ns>.json`))` e monta `messages`. Trecho real:

```ts
const messages: MessagesRecord = {
        common: {},
        home,
        landing,
        editors,
        channelManagement,
        pcOptimization,
        privacyPolicy,
        termsOfService,
        auth,
        minecraft,
        services,
        dashboard,
        publish,
        aboutMe,
        amazonAffiliate,
        homePageHero,
        minecraftPageHero,
        minecraftContributionsPageHero,
        minecraftHypixelQolPageHero,
        minecraftModpacksPageHero,
        minecraftModsPageHero,
        minecraftPluginsPageHero,
        pcOptimizationPageHero,
        pcOptimizationTerms,
        pcOptimizationTermsPageHero,
        pcOptimizationWhatsapp,
        privacyPageHero,
        servicesPageHero,
        termsOfServicePageHero,
        error,
        notFound,
        blog,
        payments,
        layout: {
            header,
            footer: await loadJson(
                () => import(`@/i18n/${selectedLocale}/layout.footer.json`)
            ),
        },
    }

    return {
        locale: selectedLocale as string,
        messages,
    }
})

```

**Carregados (34):** aboutMe.json, amazonAffiliate.json, auth.json, blog.json, channelManagement.json, dashboard.json, editors.json, error.json, home.json, homePageHero.json, landing.json, layout.footer.json, layout.header.json, minecraft.json, minecraftContributionsPageHero.json, minecraftHypixelQolPageHero.json, minecraftModpacksPageHero.json, minecraftModsPageHero.json, minecraftPageHero.json, minecraftPluginsPageHero.json, notFound.json, payments.json, pcOptimization.json, pcOptimizationPageHero.json, pcOptimizationTerms.json, pcOptimizationTermsPageHero.json, pcOptimizationWhatsapp.json, privacyPageHero.json, privacyPolicy.json, publish.json, services.json, servicesPageHero.json, termsOfService.json, termsOfServicePageHero.json

**NÃO carregados (2):** breadcrumbs.json, seo.json

> ⚠️ Ação: os arquivos existem em 5 línguas mas nunca são expostos ao front. `breadcrumbs.json` = {"home":"Home"}; `seo.json` = {personDescription, personJobTitle, websiteDescription, organizationDescription} — hoje SEO é gerado hardcoded em EN via generateSeoConfig/OgImage. Se devem ser traduzidos, precisam entrar no map (ex: `breadcrumbs, seo`) e serem consumidos via `useTranslations("breadcrumbs")` / `getTranslations`.

### 2.3 Middleware — middleware.ts

```ts
/**
 * Next.js Middleware
 * Protects dashboard routes by validating sessions before route handlers execute
 * Redirects non-locale-prefixed dashboard URLs to locale-prefixed versions
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { authMiddleware } from "@/lib/middleware/auth-middleware"
import { NextRequest, NextResponse } from "next/server"

const SUPPORTED_LOCALES = ["en", "pt-BR", "es", "de", "fr"]
const DEFAULT_LOCALE = "pt-BR"

/**
 * Get the preferred locale from the request Accept-Language header
 */
function getPreferredLocale(request: NextRequest): string {
    const acceptLanguage = request.headers.get("accept-language") || ""
    for (const locale of SUPPORTED_LOCALES) {
        if (acceptLanguage.includes(locale)) {
            return locale
        }
    }
    return DEFAULT_LOCALE
}

/**
 * Middleware to protect dashboard routes
 * Validates sessions before allowing access to protected routes.
 *
 * Protected routes:
 * - /dashboard
 * - /dashboard/publish
 * - /dashboard/insights
 * - /dashboard/settings
 *
 * For any request to a dashboard route:
 * 1. Redirect non-locale-prefixed /dashboard to /{locale}/dashboard
 * 2. Extract session token from cookie
 * 3. If invalid or expired, redirect to /{locale}/auth/login with 302 status
 * 4. If valid, allow request to proceed to route handler
 */
export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Redirect /dashboard/* (without locale) to /{locale}/dashboard/*
    if (pathname === "/dashboard" || path
```

### 2.4 URL mapping — src/lib/url-mapping.ts

```ts
import { type Locale } from "@/lib/i18n"

// URL mapping for each locale
const urlMapping: Record<Locale, Record<string, string>> = {
    en: {
        "about-me": "about-me",
        "channel-management": "channel-management",
        editors: "editors",
        "pc-optimization": "pc-optimization",
        "amazon-affiliate": "amazon-affiliate",
        "privacy-policy": "privacy-policy",
        "terms-of-service": "terms-of-service",
        login: "login",
        register: "register",
        payments: "payments",
        services: "services",
        minecraft: "minecraft",
        "minecraft-modpacks": "minecraft/modpacks",
        "minecraft-mods": "minecraft/mods",
        "minecraft-plugins": "minecraft/plugins",
        "minecraft-contributions": "minecraft/contributions",
    },
    "pt-BR": {
        "about-me": "quem-sou-eu",
        "channel-management": "gerenciamento-de-canais",
        editors: "editores",
        "pc-optimization": "otimizacao-de-pc",
        "amazon-affiliate": "afiliados-amazon",
        "privacy-policy": "politica-de-privacidade",
        "terms-of-service": "termos-de-servico",
        login: "entrar",
        register: "registrar",
        payments: "pagamentos",
        services: "servicos",
        minecraft: "minecraft",
        "minecraft-modpacks": "minecraft/modpacks",
        "minecraft-mods": "minecraft/mods",
        "minecraft-plugins": "minecraft/plugins",
        "minecraft-contributions": "minecraft/contribuicoes",
    },
    es: {
        "about-me": "acerca-de-mi",
        "channel-management": "gestion-de-canales",
        editors: "editores",
        "pc-optimization": "optimizacion-de-pc",
        "amazon-affiliate": "afiliados-amazon",
        "privacy-policy": "politica-de-privacidad",
        "terms-of-service": "terminos-de-servicio",
        login: "iniciar-sesion",
        register: "registrarse",
        payments: "pagos",
        services: "servicios",
        minecraft: "minecraft",
        "minecraft-modpacks": "minecraft/modpacks",
        "minecraft-mods": "minecraft/mods",
        "minecraft-plugins": "minecraft/plugins",
        "minecraft-contributions": "minecraft/contribuciones",
    },
```

**Cobertos:** about-me, channel-management, editors, pc-optimization, amazon-affiliate, privacy-policy, terms-of-service, login, register, payments, services, minecraft (+ subpaths: modpacks/mods/plugins/contributions).

**Não mapeados (slug fixo por locale ou sem tradução de path):** blog, dashboard/*, obs, payments/checkout, auth/complete-account, forgot-password, reset-password, affiliation-amazon variants.

## 3) Namespaces — inventário e paridade

Todos os 5 locales têm exatamente os mesmos 36 arquivos em src/i18n/<locale>/*.json + 9 em questions/*.json.

| Namespace | en | pt-BR | es | de | fr | Status |
|---|---:|---:|---:|---:|---:|---|
| aboutMe.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| amazonAffiliate.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| auth.json | 177 | 177 | 177 | 177 | 177 | ✅ paridade |
| blog.json | 6 | 6 | 6 | 6 | 6 | ✅ paridade |
| breadcrumbs.json | 1 | 1 | 1 | 1 | 1 | ✅ paridade |
| channelManagement.json | 94 | 94 | 94 | 94 | 94 | ✅ paridade |
| dashboard.json | 681 | 681 | 681 | 681 | 681 | ✅ paridade |
| editors.json | 104 | 104 | 104 | 104 | 104 | ✅ paridade |
| error.json | 5 | 5 | 5 | 5 | 5 | ✅ paridade |
| home.json | 114 | 114 | 114 | 114 | 114 | ✅ paridade |
| homePageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| landing.json | 20 | 20 | 20 | 20 | 20 | ✅ paridade |
| layout.footer.json | 16 | 16 | 16 | 16 | 16 | ✅ paridade |
| layout.header.json | 19 | 19 | 19 | 19 | 19 | ✅ paridade |
| minecraft.json | 73 | 73 | 73 | 73 | 73 | ✅ paridade |
| minecraftContributionsPageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| minecraftHypixelQolPageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| minecraftModpacksPageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| minecraftModsPageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| minecraftPageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| minecraftPluginsPageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| notFound.json | 11 | 11 | 11 | 11 | 11 | ✅ paridade |
| payments.json | 8 | 8 | 8 | 8 | 8 | ✅ paridade |
| pcOptimization.json | 34 | 34 | 34 | 34 | 34 | ✅ paridade |
| pcOptimizationPageHero.json | 4 | 4 | 4 | 4 | 4 | ✅ paridade |
| pcOptimizationTerms.json | 19 | 19 | 19 | 19 | 19 | ✅ paridade |
| pcOptimizationTermsPageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| pcOptimizationWhatsapp.json | 1 | 1 | 1 | 1 | 1 | ✅ paridade |
| privacyPageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| privacyPolicy.json | 5 | 5 | 5 | 5 | 5 | ✅ paridade |
| publish.json | 401 | 401 | 401 | 401 | 401 | ✅ paridade |
| seo.json | 4 | 4 | 4 | 4 | 4 | ✅ paridade |
| services.json | 17 | 17 | 17 | 17 | 17 | ✅ paridade |
| servicesPageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |
| termsOfService.json | 26 | 26 | 26 | 26 | 26 | ✅ paridade |
| termsOfServicePageHero.json | 3 | 3 | 3 | 3 | 3 | ✅ paridade |

Validado também em: questions/* (9 por locale: biology, language, logic, math, philosophy, physics, science, sociology, world-history) — OK, carregados dinamicamente, não via messages map.

> Por que i18n:validate passa e ainda há gaps? Porque o validador compara chaves flatten vs en dentro de cada namespace — todos têm paridade. O problema é **componente não consumindo o namespace**: a chave existe, mas a UI nunca chama t("...").

## 4) URL por idioma — slugs localizados

Wrappers físicos: cada slug localizado existe como pasta em src/app/[locale]/ e faz `export { default } from "../<canonica>/page"` + re-exporta generateMetadata. Canônicas atendem /<locale>/<slug> via param.

| Conceito | en | pt-BR | es | de | fr | Canônica | Wrappers |
|---|---|---|---|---|---|---|---|
| about-me | /en/about-me | /pt-BR/quem-sou-eu | /es/acerca-de-mi | /de/uber-mich | /fr/a-propos-de-moi | src/app/[locale]/about-me/page.tsx | quem-sou-eu, acerca-de-mi, uber-mich, a-propos-de-moi |
| channel-management | /en/channel-management | /pt-BR/gerenciamento-de-canais | /es/gestion-de-canales | /de/kanalverwaltung | /fr/gestion-de-chaine | src/app/[locale]/channel-management/page.tsx | gerenciamento-de-canais, gestion-de-canales, gestion-de-chaine, kanalverwaltung |
| editors | /en/editors | /pt-BR/editores | /es/editores | /de/editoren | /fr/editeurs | src/app/[locale]/editors/page.tsx | editores, editeurs, editoren |
| pc-optimization | /en/pc-optimization | /pt-BR/otimizacao-de-pc | /es/optimizacion-de-pc | /de/pc-optimierung | /fr/optimisation-de-pc | src/app/[locale]/pc-optimization/page.tsx | otimizacao-de-pc, optimizacion-de-pc, pc-optimierung, optimisation-de-pc |
| services | /en/services | /pt-BR/servicos | /es/servicios | /de/dienstleistungen | /fr/services | src/app/[locale]/services (pasta) | servicos, servicios, dienstleistungen |
| privacy-policy | /en/privacy-policy | /pt-BR/politica-de-privacidade | /es/politica-de-privacidad | /de/datenschutzrichtlinie | /fr/politique-de-confidentialite | src/app/[locale]/privacy-policy/page.tsx* | wrappers equivalentes |
| terms-of-service | /en/terms-of-service | /pt-BR/termos-de-servico | /es/terminos-de-servicio | /de/nutzungsbedingungen | /fr/conditions-d-utilisation | src/app/[locale]/terms-of-service/page.tsx* | wrappers equivalentes |
| amazon-affiliate | /en/amazon-affiliate | /pt-BR/afiliados-amazon | /es/afiliados-amazon | /de/amazon-partner | /fr/affiliation-amazon | src/app/[locale]/amazon-affiliate/page.tsx | afiliados-amazon, affiliation-amazon, amazon-partner |
| login | /en/login | /pt-BR/entrar | /es/iniciar-sesion | /de/anmelden | /fr/connexion | src/app/[locale]/login/page.tsx | entrar, iniciar-sesion, anmelden, connexion |
| register | /en/register | /pt-BR/registrar | /es/registrarse | /de/registrieren | /fr/s-inscrire | src/app/[locale]/register/page.tsx | registrar, registrarse, registrieren, s-inscrire |
| blog | /en/blog | /pt-BR/blog | /es/blog | /de/blog | /fr/blog | src/app/[locale]/blog/page.tsx | — (slug fixo, não localizado) |
| dashboard/* | /en/dashboard/* | /pt-BR/dashboard/* | /es/dashboard/* | /de/dashboard/* | /fr/dashboard/* | src/app/[locale]/dashboard/* | — (slug fixo) |
| minecraft/* | /en/minecraft/* | /pt-BR/minecraft/* | /es/minecraft/* | /de/minecraft/* | /fr/minecraft/* | src/app/[locale]/minecraft/* | — (slug fixo) |
| obs | /en/obs | /pt-BR/obs | /es/obs | /de/obs | /fr/obs | src/app/[locale]/obs/page.tsx | — |
| payments/checkout | /en/payments/checkout | ... | ... | ... | ... | src/app/[locale]/payments/checkout/page.tsx | — |

- privacy/terms/services às vezes vivem como pastas com wrappers e metadata dedicados; ver wrappers listados em §5.1.

## 5) Páginas — inventário completo (url / componente / língua)

Legenda: **i18n direto** = page.tsx importa e chama useTranslations/getTranslations. "Delega" = page usa section/view que pode ter i18n, mas metadata/SEO/breadcrumbs da page continuam sem i18n.

### 5.1 Wrappers (37) — re-export, i18n herdado da canônica

| Wrapper path | Re-exporta de | url por língua (5 locales, mesmo arquivo serve) |
|---|---|---|
| `src/app/[locale]/a-propos-de-moi/page.tsx` | `@/lib/i18n` | `/a-propos-de-moi` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/acerca-de-mi/page.tsx` | `@/lib/i18n` | `/acerca-de-mi` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/affiliation-amazon/page.tsx` | `@/lib/i18n` | `/affiliation-amazon` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/afiliados-amazon/page.tsx` | `@/lib/i18n` | `/afiliados-amazon` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/amazon-partner/page.tsx` | `@/lib/i18n` | `/amazon-partner` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/anmelden/page.tsx` | `@/lib/i18n` | `/anmelden` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/conditions-d-utilisation/page.tsx` | `@/lib/i18n` | `/conditions-d-utilisation` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/connexion/page.tsx` | `@/lib/i18n` | `/connexion` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/datenschutzrichtlinie/page.tsx` | `@/lib/i18n` | `/datenschutzrichtlinie` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/dienstleistungen/page.tsx` | `@/lib/i18n` | `/dienstleistungen` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/editeurs/page.tsx` | `@/lib/i18n` | `/editeurs` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/editoren/page.tsx` | `@/lib/i18n` | `/editoren` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/editores/page.tsx` | `@/lib/i18n` | `/editores` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/entrar/page.tsx` | `@/lib/i18n` | `/entrar` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/gerenciamento-de-canais/page.tsx` | `@/lib/i18n` | `/gerenciamento-de-canais` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/gestion-de-canales/page.tsx` | `@/lib/i18n` | `/gestion-de-canales` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/gestion-de-chaine/page.tsx` | `@/lib/i18n` | `/gestion-de-chaine` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/iniciar-sesion/page.tsx` | `@/lib/i18n` | `/iniciar-sesion` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/kanalverwaltung/page.tsx` | `@/lib/i18n` | `/kanalverwaltung` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/nutzungsbedingungen/page.tsx` | `@/lib/i18n` | `/nutzungsbedingungen` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/optimisation-de-pc/page.tsx` | `@/lib/i18n` | `/optimisation-de-pc` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/optimizacion-de-pc/page.tsx` | `@/lib/i18n` | `/optimizacion-de-pc` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/otimizacao-de-pc/page.tsx` | `@/lib/i18n` | `/otimizacao-de-pc` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/pc-optimierung/page.tsx` | `@/lib/i18n` | `/pc-optimierung` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/politica-de-privacidad/page.tsx` | `@/lib/i18n` | `/politica-de-privacidad` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/politica-de-privacidade/page.tsx` | `@/lib/i18n` | `/politica-de-privacidade` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/politique-de-confidentialite/page.tsx` | `@/lib/i18n` | `/politique-de-confidentialite` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/quem-sou-eu/page.tsx` | `@/lib/i18n` | `/quem-sou-eu` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/registrar/page.tsx` | `@/lib/i18n` | `/registrar` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/registrarse/page.tsx` | `@/lib/i18n` | `/registrarse` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/registrieren/page.tsx` | `@/lib/i18n` | `/registrieren` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/s-inscrire/page.tsx` | `@/lib/i18n` | `/s-inscrire` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/servicios/page.tsx` | `@/lib/i18n` | `/servicios` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/servicos/page.tsx` | `@/lib/i18n` | `/servicos` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/terminos-de-servicio/page.tsx` | `@/lib/i18n` | `/terminos-de-servicio` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/termos-de-servico/page.tsx` | `@/lib/i18n` | `/termos-de-servico` via [locale] param (en/pt-BR/es/de/fr) |
| `src/app/[locale]/uber-mich/page.tsx` | `@/lib/i18n` | `/uber-mich` via [locale] param (en/pt-BR/es/de/fr) |

### 5.2 Canônicas (52) — url / componente / língua + i18n

| # | Componente | url en | url pt-BR | url es | url de | url fr | i18n direto | namespaces | Diagnóstico |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `[locale]/about-me/page.tsx` | `/en/about-me` | `/pt-BR/quem-sou-eu` | `/es/acerca-de-mi` | `/de/uber-mich` | `/fr/a-propos-de-moi` | ❌ | `—` | ⚠️ Delegado: AboutMeSection tem i18n (aboutMe), mas page metadata/SEO hardcoded EN + StructuredData sem t() |
| 2 | `[locale]/amazon-affiliate/page.tsx` | `/en/amazon-affiliate` | `/pt-BR/afiliados-amazon` | `/es/afiliados-amazon` | `/de/amazon-partner` | `/fr/affiliation-amazon` | ✅ | `amazonAffiliate` | ✅ |
| 3 | `[locale]/auth/complete-account/page.tsx` | `/en/auth/complete-account` | `/pt-BR/auth/complete-account` | `/es/auth/complete-account` | `/de/auth/complete-account` | `/fr/auth/complete-account` | ✅ | `auth, auth` | ✅ |
| 4 | `[locale]/blog/[slug]/page.tsx` | `/en/blog/[slug]` | `/pt-BR/blog/[slug]` | `/es/blog/[slug]` | `/de/blog/[slug]` | `/fr/blog/[slug]` | ✅ | `blog` | ✅ |
| 5 | `[locale]/blog/page.tsx` | `/en/blog` | `/pt-BR/blog` | `/es/blog` | `/de/blog` | `/fr/blog` | ✅ | `blog` | ✅ |
| 6 | `[locale]/channel-management/page.tsx` | `/en/channel-management` | `/pt-BR/gerenciamento-de-canais` | `/es/gestion-de-canales` | `/de/kanalverwaltung` | `/fr/gestion-de-chaine` | ❌ | `—` | ⚠️ Delegado parcial: channel-management-view/breadcrumbs têm i18n, mas page.tsx sem t() — breadcrumbs/SEO vêm de helper hardcoded |
| 7 | `[locale]/dashboard/channels/page.tsx` | `/en/dashboard/channels` | `/pt-BR/dashboard/channels` | `/es/dashboard/channels` | `/de/dashboard/channels` | `/fr/dashboard/channels` | ✅ | `dashboard` | ✅ |
| 8 | `[locale]/dashboard/cloner/page.tsx` | `/en/dashboard/cloner` | `/pt-BR/dashboard/cloner` | `/es/dashboard/cloner` | `/de/dashboard/cloner` | `/fr/dashboard/cloner` | ✅ | `dashboard.cloner` | ✅ |
| 9 | `[locale]/dashboard/credits/page.tsx` | `/en/dashboard/credits` | `/pt-BR/dashboard/credits` | `/es/dashboard/credits` | `/de/dashboard/credits` | `/fr/dashboard/credits` | ✅ | `dashboard.credits` | ✅ |
| 10 | `[locale]/dashboard/discover/page.tsx` | `/en/dashboard/discover` | `/pt-BR/dashboard/discover` | `/es/dashboard/discover` | `/de/dashboard/discover` | `/fr/dashboard/discover` | ✅ | `dashboard.discover` | ✅ |
| 11 | `[locale]/dashboard/docs/[category]/page.tsx` | `/en/dashboard/docs/[category]` | `/pt-BR/dashboard/docs/[category]` | `/es/dashboard/docs/[category]` | `/de/dashboard/docs/[category]` | `/fr/dashboard/docs/[category]` | ❌ | `—` | ❌ Sem i18n — docs/tutorial hardcoded |
| 12 | `[locale]/dashboard/docs/page.tsx` | `/en/dashboard/docs` | `/pt-BR/dashboard/docs` | `/es/dashboard/docs` | `/de/dashboard/docs` | `/fr/dashboard/docs` | ❌ | `—` | ❌ Sem i18n — docs/tutorial hardcoded |
| 13 | `[locale]/dashboard/insights/page.tsx` | `/en/dashboard/insights` | `/pt-BR/dashboard/insights` | `/es/dashboard/insights` | `/de/dashboard/insights` | `/fr/dashboard/insights` | ✅ | `dashboard.insights` | ✅ |
| 14 | `[locale]/dashboard/live/chat-popout/page.tsx` | `/en/dashboard/live/chat-popout` | `/pt-BR/dashboard/live/chat-popout` | `/es/dashboard/live/chat-popout` | `/de/dashboard/live/chat-popout` | `/fr/dashboard/live/chat-popout` | ✅ | `dashboard` | ✅ |
| 15 | `[locale]/dashboard/live/page.tsx` | `/en/dashboard/live` | `/pt-BR/dashboard/live` | `/es/dashboard/live` | `/de/dashboard/live` | `/fr/dashboard/live` | ✅ | `dashboard.live` | ✅ |
| 16 | `[locale]/dashboard/page.tsx` | `/en/dashboard` | `/pt-BR/dashboard` | `/es/dashboard` | `/de/dashboard` | `/fr/dashboard` | ✅ | `dashboard.common` | ✅ |
| 17 | `[locale]/dashboard/publish/page.tsx` | `/en/dashboard/publish` | `/pt-BR/dashboard/publish` | `/es/dashboard/publish` | `/de/dashboard/publish` | `/fr/dashboard/publish` | ✅ | `dashboard.publish` | ✅ |
| 18 | `[locale]/dashboard/repost/page.tsx` | `/en/dashboard/repost` | `/pt-BR/dashboard/repost` | `/es/dashboard/repost` | `/de/dashboard/repost` | `/fr/dashboard/repost` | ✅ | `dashboard.repost` | ✅ |
| 19 | `[locale]/dashboard/settings/page.tsx` | `/en/dashboard/settings` | `/pt-BR/dashboard/settings` | `/es/dashboard/settings` | `/de/dashboard/settings` | `/fr/dashboard/settings` | ✅ | `dashboard.settings` | ✅ |
| 20 | `[locale]/editors/page.tsx` | `/en/editors` | `/pt-BR/editores` | `/es/editores` | `/de/editoren` | `/fr/editeurs` | ❌ | `—` | ⚠️ Delegado: editors-view/breadcrumbs têm i18n, page sem t() |
| 21 | `[locale]/forgot-password/page.tsx` | `/en/forgot-password` | `/pt-BR/forgot-password` | `/es/forgot-password` | `/de/forgot-password` | `/fr/forgot-password` | ✅ | `auth, auth` | ✅ |
| 22 | `[locale]/login/page.tsx` | `/en/login` | `/pt-BR/entrar` | `/es/iniciar-sesion` | `/de/anmelden` | `/fr/connexion` | ❌ | `—` | ❌ Sem i18n direto — auth/login flow; verificar login-form.tsx/auth namespace |
| 23 | `[locale]/minecraft/contributions/page.tsx` | `/en/minecraft/contributions` | `/pt-BR/minecraft/contributions` | `/es/minecraft/contributions` | `/de/minecraft/contributions` | `/fr/minecraft/contributions` | ✅ | `minecraft, minecraft, minecraftContributionsPageHero` | ✅ |
| 24 | `[locale]/minecraft/modpacks/hypixel-qol/page.tsx` | `/en/minecraft/modpacks/hypixel-qol` | `/pt-BR/minecraft/modpacks/hypixel-qol` | `/es/minecraft/modpacks/hypixel-qol` | `/de/minecraft/modpacks/hypixel-qol` | `/fr/minecraft/modpacks/hypixel-qol` | ✅ | `minecraft, minecraft, minecraftHypixelQolPageHero` | ✅ |
| 25 | `[locale]/minecraft/modpacks/page.tsx` | `/en/minecraft/modpacks` | `/pt-BR/minecraft/modpacks` | `/es/minecraft/modpacks` | `/de/minecraft/modpacks` | `/fr/minecraft/modpacks` | ✅ | `minecraft, minecraft, minecraftModpacksPageHero` | ✅ |
| 26 | `[locale]/minecraft/mods/page.tsx` | `/en/minecraft/mods` | `/pt-BR/minecraft/mods` | `/es/minecraft/mods` | `/de/minecraft/mods` | `/fr/minecraft/mods` | ✅ | `minecraft, minecraft, minecraftModsPageHero` | ✅ |
| 27 | `[locale]/minecraft/page.tsx` | `/en/minecraft` | `/pt-BR/minecraft` | `/es/minecraft` | `/de/minecraft` | `/fr/minecraft` | ✅ | `minecraft, minecraft, minecraftPageHero` | ✅ |
| 28 | `[locale]/minecraft/plugins/page.tsx` | `/en/minecraft/plugins` | `/pt-BR/minecraft/plugins` | `/es/minecraft/plugins` | `/de/minecraft/plugins` | `/fr/minecraft/plugins` | ✅ | `minecraft, minecraft, minecraftPluginsPageHero` | ✅ |
| 29 | `[locale]/obs/page.tsx` | `/en/obs` | `/pt-BR/obs` | `/es/obs` | `/de/obs` | `/fr/obs` | ✅ | `dashboard` | ✅ |
| 30 | `[locale]/page.tsx` | `/en/page.tsx` | `/pt-BR/page.tsx` | `/es/page.tsx` | `/de/page.tsx` | `/fr/page.tsx` | ✅ | `landing` | ✅ |
| 31 | `[locale]/payments/checkout/page.tsx` | `/en/payments/checkout` | `/pt-BR/payments/checkout` | `/es/payments/checkout` | `/de/payments/checkout` | `/fr/payments/checkout` | ✅ | `payments, payments` | ✅ |
| 32 | `[locale]/pc-optimization/page.tsx` | `/en/pc-optimization` | `/pt-BR/otimizacao-de-pc` | `/es/optimizacion-de-pc` | `/de/pc-optimierung` | `/fr/optimisation-de-pc` | ❌ | `—` | ⚠️ Delegado: pc-optimization-view/breadcrumbs têm i18n, page sem t() |
| 33 | `[locale]/pc-optimization/terms/page.tsx` | `/en/pc-optimization/terms` | `/pt-BR/otimizacao-de-pc/terms` | `/es/optimizacion-de-pc/terms` | `/de/pc-optimierung/terms` | `/fr/optimisation-de-pc/terms` | ✅ | `pcOptimizationTerms, pcOptimizationTermsPageHero` | ✅ |
| 34 | `[locale]/privacy-policy/page.tsx` | `/en/privacy-policy` | `/pt-BR/politica-de-privacidade` | `/es/politica-de-privacidad` | `/de/datenschutzrichtlinie` | `/fr/politique-de-confidentialite` | ✅ | `privacyPolicy, privacyPageHero` | ✅ |
| 35 | `[locale]/register/page.tsx` | `/en/register` | `/pt-BR/registrar` | `/es/registrarse` | `/de/registrieren` | `/fr/s-inscrire` | ❌ | `—` | ❌ Sem i18n direto — auth/register flow |
| 36 | `[locale]/reset-password/page.tsx` | `/en/reset-password` | `/pt-BR/reset-password` | `/es/reset-password` | `/de/reset-password` | `/fr/reset-password` | ✅ | `auth, auth` | ✅ |
| 37 | `[locale]/services/page.tsx` | `/en/services` | `/pt-BR/servicos` | `/es/servicios` | `/de/dienstleistungen` | `/fr/services` | ✅ | `services, services, servicesPageHero` | ✅ |
| 38 | `[locale]/signin/page.tsx` | `/en/signin` | `/pt-BR/signin` | `/es/signin` | `/de/signin` | `/fr/signin` | ✅ | `auth` | ✅ |
| 39 | `[locale]/streamer/[slug]/page.tsx` | `/en/streamer/[slug]` | `/pt-BR/streamer/[slug]` | `/es/streamer/[slug]` | `/de/streamer/[slug]` | `/fr/streamer/[slug]` | ✅ | `streamer` | ✅ |
| 40 | `[locale]/terms-of-service/page.tsx` | `/en/terms-of-service` | `/pt-BR/termos-de-servico` | `/es/terminos-de-servicio` | `/de/nutzungsbedingungen` | `/fr/conditions-d-utilisation` | ✅ | `termsOfServicePageHero` | ✅ |
| 41 | `channel-management/page.tsx` | `/channel-management (sem [locale])` | `/channel-management (sem [locale])` | `/channel-management (sem [locale])` | `/channel-management (sem [locale])` | `/channel-management (sem [locale])` | ❌ | `—` | ⚠️ Delegado parcial: channel-management-view/breadcrumbs têm i18n, mas page.tsx sem t() — breadcrumbs/SEO vêm de helper hardcoded |
| 42 | `dashboard/credits/page.tsx` | `/dashboard/credits (sem [locale])` | `/dashboard/credits (sem [locale])` | `/dashboard/credits (sem [locale])` | `/dashboard/credits (sem [locale])` | `/dashboard/credits (sem [locale])` | ✅ | `dashboard.credits` | ✅ |
| 43 | `dashboard/insights/page.tsx` | `/dashboard/insights (sem [locale])` | `/dashboard/insights (sem [locale])` | `/dashboard/insights (sem [locale])` | `/dashboard/insights (sem [locale])` | `/dashboard/insights (sem [locale])` | ✅ | `dashboard.insights` | ✅ |
| 44 | `dashboard/page.tsx` | `/dashboard (sem [locale])` | `/dashboard (sem [locale])` | `/dashboard (sem [locale])` | `/dashboard (sem [locale])` | `/dashboard (sem [locale])` | ✅ | `dashboard.common` | ✅ |
| 45 | `dashboard/publish/page.tsx` | `/dashboard/publish (sem [locale])` | `/dashboard/publish (sem [locale])` | `/dashboard/publish (sem [locale])` | `/dashboard/publish (sem [locale])` | `/dashboard/publish (sem [locale])` | ✅ | `dashboard.publish` | ✅ |
| 46 | `dashboard/settings/page.tsx` | `/dashboard/settings (sem [locale])` | `/dashboard/settings (sem [locale])` | `/dashboard/settings (sem [locale])` | `/dashboard/settings (sem [locale])` | `/dashboard/settings (sem [locale])` | ❌ | `—` | ❌ LEGADO /dashboard sem [locale] — depende de middleware redirect |
| 47 | `editors/page.tsx` | `/editors (sem [locale])` | `/editors (sem [locale])` | `/editors (sem [locale])` | `/editors (sem [locale])` | `/editors (sem [locale])` | ❌ | `—` | ⚠️ Delegado: editors-view/breadcrumbs têm i18n, page sem t() |
| 48 | `gabriel-toth-goncalves/page.tsx` | `/gabriel-toth-goncalves (sem [locale])` | `/gabriel-toth-goncalves (sem [locale])` | `/gabriel-toth-goncalves (sem [locale])` | `/gabriel-toth-goncalves (sem [locale])` | `/gabriel-toth-goncalves (sem [locale])` | ✅ | `home` | ✅ |
| 49 | `page.tsx` | `/ (sem [locale])` | `/ (sem [locale])` | `/ (sem [locale])` | `/ (sem [locale])` | `/ (sem [locale])` | ❌ | `—` | ❌ LEGADO sem [locale] — redirect/landing fora do fluxo next-intl |
| 50 | `pc-optimization/page.tsx` | `/pc-optimization (sem [locale])` | `/pc-optimization (sem [locale])` | `/pc-optimization (sem [locale])` | `/pc-optimization (sem [locale])` | `/pc-optimization (sem [locale])` | ❌ | `—` | ⚠️ Delegado: pc-optimization-view/breadcrumbs têm i18n, page sem t() |
| 51 | `privacy-policy/page.tsx` | `/privacy-policy (sem [locale])` | `/privacy-policy (sem [locale])` | `/privacy-policy (sem [locale])` | `/privacy-policy (sem [locale])` | `/privacy-policy (sem [locale])` | ❌ | `—` | ❌ LEGADO sem [locale] — duplicata fora de [locale], sem i18n |
| 52 | `terms-of-service/page.tsx` | `/terms-of-service (sem [locale])` | `/terms-of-service (sem [locale])` | `/terms-of-service (sem [locale])` | `/terms-of-service (sem [locale])` | `/terms-of-service (sem [locale])` | ❌ | `—` | ❌ LEGADO sem [locale] — duplicata fora de [locale], sem i18n |

> Nota: wrappers não aparecem aqui; eles expõem o mesmo conteúdo canônico sob slugs traduzidos (ver §5.1). Para auditar "url por língua" real, combine canônica + wrappers do mesmo conceito (ex: canônica about-me + wrappers quem-sou-eu etc.).

## 6) Componentes — inventário

**Total .tsx (app+components, sem testes):** 323 → **144 com i18n** / **179 sem i18n direto**.

"Sem i18n direto" inclui: ui primitivos (button, dialog, etc.) que são atômicos e corretamente sem tradução, + views/sections que deveriam ter mas não têm. Abaixo amostragem por diretório.

### 6.1 Sem i18n — por diretório

| Diretório | Qtd sem i18n | Comentário |
|---|---:|---|
| `src/app/[locale]` | 49 | Pages/sections/views — ver §5.2 e §7 |
| `src/components/ui` | 37 | Esperado: primitivos sem copy (ok se não têm texto) |
| `src/components/registration` | 23 | ⚠️ Fluxos de conta — checar se usam auth namespace |
| `src/components/dashboard` | 17 | Misto: alguns têm i18n, outros delegam |
| `src/components/auth` | 10 | ⚠️ Auth forms — devem usar auth namespace |
| `src/components/publish` | 6 |  |
| `src/components/AuthenticationScreen` | 4 |  |
| `src/components/theme` | 4 |  |
| `src/app/dashboard` | 2 | Misto: alguns têm i18n, outros delegam |
| `src/components/analytics` | 2 |  |
| `src/components/layout` | 2 |  |
| `src/components/notifications` | 2 |  |
| `src/components/seo` | 2 |  |
| `src/app/500.tsx` | 1 |  |
| `src/app/channel-management` | 1 |  |
| `src/app/editors` | 1 |  |
| `src/app/error.tsx` | 1 |  |
| `src/app/gabriel-toth-goncalves` | 1 |  |
| `src/app/layout.tsx` | 1 |  |
| `src/app/not-found.tsx` | 1 |  |
| `src/app/page.tsx` | 1 |  |
| `src/app/pc-optimization` | 1 |  |
| `src/app/privacy-policy` | 1 |  |
| `src/app/terms-of-service` | 1 |  |
| `src/components/bfcache-reload.tsx` | 1 |  |
| `src/components/credits` | 1 |  |
| `src/components/debug` | 1 |  |
| `src/components/history` | 1 |  |
| `src/components/providers` | 1 |  |
| `src/components/settings` | 1 |  |
| `src/components/testimonials.tsx` | 1 |  |
| `src/components/tutorial` | 1 |  |

### 6.2 Lista — sem i18n direto (184 arquivos)

<details><summary>Clique para expandir (184)</summary>

- `src/app/500.tsx`
- `src/app/[locale]/a-propos-de-moi/page.tsx`
- `src/app/[locale]/about-me/page.tsx`
- `src/app/[locale]/acerca-de-mi/page.tsx`
- `src/app/[locale]/affiliation-amazon/page.tsx`
- `src/app/[locale]/afiliados-amazon/page.tsx`
- `src/app/[locale]/amazon-partner/page.tsx`
- `src/app/[locale]/anmelden/page.tsx`
- `src/app/[locale]/channel-management/page.tsx`
- `src/app/[locale]/conditions-d-utilisation/page.tsx`
- `src/app/[locale]/connexion/page.tsx`
- `src/app/[locale]/dashboard/docs/[category]/page.tsx`
- `src/app/[locale]/dashboard/docs/page.tsx`
- `src/app/[locale]/dashboard/layout.tsx`
- `src/app/[locale]/datenschutzrichtlinie/page.tsx`
- `src/app/[locale]/dienstleistungen/page.tsx`
- `src/app/[locale]/editeurs/page.tsx`
- `src/app/[locale]/editoren/page.tsx`
- `src/app/[locale]/editores/page.tsx`
- `src/app/[locale]/editors/editors-card.tsx`
- `src/app/[locale]/editors/page.tsx`
- `src/app/[locale]/entrar/page.tsx`
- `src/app/[locale]/gerenciamento-de-canais/page.tsx`
- `src/app/[locale]/gestion-de-canales/page.tsx`
- `src/app/[locale]/gestion-de-chaine/page.tsx`
- `src/app/[locale]/iniciar-sesion/page.tsx`
- `src/app/[locale]/kanalverwaltung/page.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/locale-provider.tsx`
- `src/app/[locale]/login/page.tsx`
- `src/app/[locale]/nutzungsbedingungen/page.tsx`
- `src/app/[locale]/optimisation-de-pc/page.tsx`
- `src/app/[locale]/optimizacion-de-pc/page.tsx`
- `src/app/[locale]/otimizacao-de-pc/page.tsx`
- `src/app/[locale]/pc-optimierung/page.tsx`
- `src/app/[locale]/pc-optimization/page.tsx`
- `src/app/[locale]/politica-de-privacidad/page.tsx`
- `src/app/[locale]/politica-de-privacidade/page.tsx`
- `src/app/[locale]/politique-de-confidentialite/page.tsx`
- `src/app/[locale]/quem-sou-eu/page.tsx`
- `src/app/[locale]/register/page.tsx`
- `src/app/[locale]/registrar/page.tsx`
- `src/app/[locale]/registrarse/page.tsx`
- `src/app/[locale]/registrieren/page.tsx`
- `src/app/[locale]/s-inscrire/page.tsx`
- `src/app/[locale]/servicios/page.tsx`
- `src/app/[locale]/servicos/page.tsx`
- `src/app/[locale]/terminos-de-servicio/page.tsx`
- `src/app/[locale]/termos-de-servico/page.tsx`
- `src/app/[locale]/uber-mich/page.tsx`
- `src/app/channel-management/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/settings/page.tsx`
- `src/app/editors/page.tsx`
- `src/app/error.tsx`
- `src/app/gabriel-toth-goncalves/layout.tsx`
- `src/app/layout.tsx`
- `src/app/not-found.tsx`
- `src/app/page.tsx`
- `src/app/pc-optimization/page.tsx`
- `src/app/privacy-policy/page.tsx`
- `src/app/terms-of-service/page.tsx`
- `src/components/AuthenticationScreen/AuthButtonRow/AuthButton/AuthButton.tsx`
- `src/components/AuthenticationScreen/AuthButtonRow/AuthButtonRow.tsx`
- `src/components/AuthenticationScreen/AuthenticationScreen.tsx`
- `src/components/AuthenticationScreen/EmailAuthForm/EmailAuthForm.tsx`
- `src/components/analytics/performance-monitor.tsx`
- `src/components/analytics/web-vitals.tsx`
- `src/components/auth/dashboard.tsx`
- `src/components/auth/error-display.tsx`
- `src/components/auth/forgot-password-form.tsx`
- `src/components/auth/login-form.tsx`
- `src/components/auth/password-strength-indicator.tsx`
- `src/components/auth/password-visibility-toggle.tsx`
- `src/components/auth/protected-route.tsx`
- `src/components/auth/register-form.tsx`
- `src/components/auth/reset-password-form.tsx`
- `src/components/auth/turnstile-widget.tsx`
- `src/components/bfcache-reload.tsx`
- `src/components/credits/CreditBadge.tsx`
- `src/components/dashboard/ChannelConnector.stories.tsx`
- `src/components/dashboard/DashboardLayout.stories.tsx`
- `src/components/dashboard/NavMenu.stories.tsx`
- `src/components/dashboard/NotificationBell.tsx`
- `src/components/dashboard/Sidebar.stories.tsx`
- `src/components/dashboard/groups/channel-group-manager.tsx`
- `src/components/dashboard/live/chat-command-palette.tsx`
- `src/components/dashboard/live/chat-execution-mode-toggle.tsx`
- `src/components/dashboard/live/chat-message-list.tsx`
- `src/components/dashboard/live/chat-moderation-panel.tsx`
- `src/components/dashboard/live/stream-health-card.tsx`
- `src/components/dashboard/live/stream-health-header.tsx`
- `src/components/dashboard/live/stream-key-card.tsx`
- `src/components/dashboard/live/stream-status-card.tsx`
- `src/components/dashboard/live/stream-title-editor.tsx`
- `src/components/dashboard/live/unified-chat.tsx`
- `src/components/dashboard/live/user-card.tsx`
- `src/components/debug/questions-debug-panel.tsx`
- `src/components/history/PublicationHistory.tsx`
- `src/components/layout/language-selector-wrapper.tsx`
- `src/components/layout/page-header.tsx`
- `src/components/notifications/ErrorNotification.tsx`
- `src/components/notifications/SuccessNotification.tsx`
- `src/components/providers/PublicationQueueProvider.tsx`
- `src/components/publish/FilterBar.stories.tsx`
- `src/components/publish/PostCard.stories.tsx`
- `src/components/publish/PostList.stories.tsx`
- `src/components/publish/PublishContainer.stories.tsx`
- `src/components/publish/wizard/StepProgressBar.tsx`
- `src/components/publish/wizard/TagInput.tsx`
- `src/components/registration/AuthenticationEntry.stories.tsx`
- `src/components/registration/AuthenticationEntry.tsx`
- `src/components/registration/EmailInput.stories.tsx`
- `src/components/registration/EmailInput.tsx`
- `src/components/registration/ErrorDisplay.stories.tsx`
- `src/components/registration/ErrorDisplay.tsx`
- `src/components/registration/GoogleOAuthFlow.stories.tsx`
- `src/components/registration/GoogleOAuthFlow.tsx`
- `src/components/registration/GoogleOAuthPersonalInfo.stories.tsx`
- `src/components/registration/GoogleOAuthPersonalInfo.tsx`
- `src/components/registration/NavigationButtons.tsx`
- `src/components/registration/PasswordSetup.stories.tsx`
- `src/components/registration/PasswordSetup.tsx`
- `src/components/registration/PersonalDataForm.stories.tsx`
- `src/components/registration/PersonalDataForm.tsx`
- `src/components/registration/ProgressIndicator.stories.tsx`
- `src/components/registration/ProgressIndicator.tsx`
- `src/components/registration/RegistrationFlow.stories.tsx`
- `src/components/registration/RegistrationFlow.tsx`
- `src/components/registration/SuccessMessage.stories.tsx`
- `src/components/registration/SuccessMessage.tsx`
- `src/components/registration/VerificationReview.stories.tsx`
- `src/components/registration/VerificationReview.tsx`
- `src/components/seo/seo-provider.tsx`
- `src/components/seo/structured-data.tsx`
- `src/components/settings/LocalEnvSection.tsx`
- `src/components/testimonials.tsx`
- `src/components/theme/theme-provider.tsx`
- `src/components/theme/theme-script.tsx`
- `src/components/theme/theme-toggle-client.tsx`
- `src/components/theme/theme-toggle.tsx`
- `src/components/tutorial/tutorial-provider.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/badge.stories.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/breadcrumbs.stories.tsx`
- `src/components/ui/button.stories.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.stories.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/dialog.stories.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/dynamic-icon.tsx`
- `src/components/ui/execution-mode-switch.tsx`
- `src/components/ui/icon.tsx`
- `src/components/ui/input.stories.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.stories.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/language-selector.stories.tsx`
- `src/components/ui/language-selector.tsx`
- `src/components/ui/modal.stories.tsx`
- `src/components/ui/modal.tsx`
- `src/components/ui/pricing-toggle.stories.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/select.stories.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/separator.stories.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/tabs.stories.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/textarea.stories.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/toggle.stories.tsx`
- `src/components/ui/toggle.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/whatsapp-button.stories.tsx`
- `src/components/ui/whatsapp-button.tsx`

</details>

### 6.3 Lista — com i18n direto (139 arquivos, amostra 40)

- `src/app/[locale]/about-me/about-me-section.tsx` → `aboutMe`
- `src/app/[locale]/amazon-affiliate/page.tsx` → `amazonAffiliate`
- `src/app/[locale]/auth/complete-account/complete-account-form.tsx` → `auth`
- `src/app/[locale]/auth/complete-account/components/data-summary.tsx` → `auth`
- `src/app/[locale]/auth/complete-account/components/field-editor.tsx` → `auth`
- `src/app/[locale]/auth/complete-account/components/password-strength.tsx` → `auth`
- `src/app/[locale]/auth/complete-account/components/progress-indicator.tsx` → `auth`
- `src/app/[locale]/auth/complete-account/page.tsx` → `auth, auth`
- `src/app/[locale]/auth/complete-account/steps/step-1-prefilled.tsx` → `auth`
- `src/app/[locale]/auth/complete-account/steps/step-2-new-fields.tsx` → `auth`
- `src/app/[locale]/auth/complete-account/steps/step-3-verification.tsx` → `auth`
- `src/app/[locale]/blog/[slug]/page.tsx` → `blog`
- `src/app/[locale]/blog/page.tsx` → `blog`
- `src/app/[locale]/channel-management/channel-management-view.tsx` → `channelManagement, channelManagement, channelManagement, channelManagement, channelManagement, channelManagement, channelManagement, channelManagement`
- `src/app/[locale]/dashboard/channels/page.tsx` → `dashboard`
- `src/app/[locale]/dashboard/cloner/page.tsx` → `dashboard.cloner`
- `src/app/[locale]/dashboard/credits/page.tsx` → `dashboard.credits`
- `src/app/[locale]/dashboard/dashboard-layout-client.tsx` → `dashboard.common`
- `src/app/[locale]/dashboard/discover/page.tsx` → `dashboard.discover`
- `src/app/[locale]/dashboard/insights/page.tsx` → `dashboard.insights`
- `src/app/[locale]/dashboard/live/chat-popout/page.tsx` → `dashboard`
- `src/app/[locale]/dashboard/live/page.tsx` → `dashboard.live`
- `src/app/[locale]/dashboard/page.tsx` → `dashboard.common`
- `src/app/[locale]/dashboard/publish/page.tsx` → `dashboard.publish`
- `src/app/[locale]/dashboard/repost/page.tsx` → `dashboard.repost`
- `src/app/[locale]/dashboard/settings/page.tsx` → `dashboard.settings`
- `src/app/[locale]/editors/editors-form.tsx` → `channelManagement, editors`
- `src/app/[locale]/editors/editors-view.tsx` → `editors, editors, editors, editors, editors, editors`
- `src/app/[locale]/error.tsx` → `error`
- `src/app/[locale]/forgot-password/forgot-password-form.tsx` → `auth`
- `src/app/[locale]/forgot-password/page.tsx` → `auth, auth`
- `src/app/[locale]/home/about-section.tsx` → `home.about`
- `src/app/[locale]/home/channel-management-section.tsx` → `home, channelManagement`
- `src/app/[locale]/home/contact-section.tsx` → `home.contact`
- `src/app/[locale]/home/hero-section.tsx` → `home.hero`
- `src/app/[locale]/home/landing-benefits-section.tsx` → `landing`
- `src/app/[locale]/home/landing-cta-section.tsx` → `landing`
- `src/app/[locale]/home/landing-faq-section.tsx` → `landing`
- `src/app/[locale]/home/landing-features-section.tsx` → `landing`
- `src/app/[locale]/home/landing-hero-section.tsx` → `landing, homePageHero`
- ... e mais 104 com i18n

## 7) Gaps — o que NÃO está traduzido

Prioridade P0 = quebra de experiência por idioma; P1 = dívida visível; P2 = infra/polimento.

| # | url / componente / língua | Tipo | Evidência | Prioridade | Correção sugerida |
|---|---|---|---|---|---|
| 1 | url: /{locale}/blog e /{locale}/blog/[slug] · comp: src/app/[locale]/blog/page.tsx, [slug]/page.tsx · língua: 5 | Página sem i18n | 2 page.tsx sem useTranslations/getTranslations; sem namespace blog em request.ts/i18n | P0 | Criar src/i18n/<locale>/blog.json + carregar em request.ts + t() em lista/detalhe |
| 2 | url: /{locale}/login e wrappers /entrar/iniciar-sesion/anmelden/connexion · comp: src/app/[locale]/login/page.tsx · língua: 5 | Auth page sem i18n | page.tsx sem t(); depende de filho login-form mas metadata/SEO da page hardcoded | P0 | Adicionar getTranslations("auth") na page (title/desc/metadata) + garantir login-form usa auth |
| 3 | url: /{locale}/register e wrappers · comp: src/app/[locale]/register/page.tsx | Auth page sem i18n | igual login | P0 | idem |
| 4 | url: /{locale}/obs · comp: src/app/[locale]/obs/page.tsx · 5 | Página sem i18n | page sem t() | P0 | Criar namespace obs ou reutilizar dashboard |
| 5 | url: /{locale}/payments/checkout · comp: src/app/[locale]/payments/checkout/page.tsx · 5 | Checkout sem i18n | hardcoded | P0 | Namespace payments/checkout |
| 6 | url: /{locale}/dashboard/docs e /{locale}/dashboard/docs/[category] · comp: docs/page.tsx, [category]/page.tsx · 5 | Docs sem i18n | sem t() | P1 | Namespace docs/tutorial |
| 7 | url: /{locale}/dashboard/live/chat-popout · comp: chat-popout/page.tsx · 5 | Popout sem i18n | títulos/copy hardcoded ("Popout Chat", "Copiar URL para usar no OBS") | P1 | dashboard.live namespace |
| 8 | url: /{locale}/about-me (e wrappers) · comp: src/app/[locale]/about-me/page.tsx · 5 | Delegação parcial | page sem t(); AboutMeSection OK (aboutMe), mas generateMetadata/generateSeoConfig/OgImage hardcoded EN | P1 | Adicionar getTranslations("aboutMe"/"seo") na page para metadata/SEO |
| 9 | url: /{locale}/channel-management (+ wrappers) · comp: channel-management/page.tsx · 5 | Delegação parcial | page sem t(); view/breadcrumbs têm i18n, mas SEO/breadcrumbs helper com strings hardcoded | P1 | Mover breadcrumbs/SEO para namespaces + t() na page |
| 10 | url: /{locale}/editors (+ wrappers) · comp: editors/page.tsx · 5 | Delegação parcial | idem | P1 | idem |
| 11 | url: /{locale}/pc-optimization (+ wrappers) · comp: pc-optimization/page.tsx · 5 | Delegação parcial | idem | P1 | idem |
| 12 | url: /channel-management, /editors, /pc-optimization, /privacy-policy, /terms-of-service (sem [locale]) · comps: src/app/channel-management/page.tsx etc. · 5 | Legado sem [locale] | páginas fora de [locale] duplicam canônicas, sem i18n, fora do fluxo next-intl | P1 | Remover ou redirecionar para /{locale}/<slug> (middleware) |
| 13 | url: / (raiz) · comp: src/app/page.tsx · 5 | Landing sem [locale] | sem t() | P1 | Manter apenas como redirect para /{locale} (já existe?) ou adicionar i18n |
| 14 | url: /{locale}/dashboard/settings (legado) · comp: src/app/dashboard/settings/page.tsx · 5 | Duplicata | depende de middleware redirect | P2 | Remover duplicata, manter só [locale]/dashboard/settings |
| 15 | namespaces breadcrumbs.json, seo.json · 5 | Infra não carregada | existem em 5 línguas mas não entram em messages (request.ts) | P2 | Adicionar ao messages map ou remover arquivos se obsoletos |
| 16 | url: src/components/registration/*, src/components/auth/* · 5 | Componentes auth sem i18n | parte dos fluxos não usa t() direto (usa prop drilling) | P1 | Garantir todo registration/* usa auth namespace |
| 17 | url: dashboard/cloner, discover, repost — placeholders hardcoded | Componentes com i18n mas com strings residuais | grep encontrou placeholders hardcoded mesmo em arquivos com t() (ex: "Cole a URL...", "Carregar JSON Local") | P1 | Mover todos placeholders/títulos para dashboard.json |

## 8) Hardcoded strings — amostra

Heurística: texto entre >...< em .tsx sem t()/useTranslations/getTranslations na linha (filtro de className/aria-*). 

Amostra de 120 ocorrências (priorizar P0/P1):

| # | Componente | Linha | Texto hardcoded | url afetada | língua |
|---|---|---:|---|---|---|
| 1 | `src/app/not-found.tsx` | 89 | "Ver em Português" | `/not-found.tsx` | 5 (hardcoded igual em todas) |
| 2 | `src/app/not-found.tsx` | 99 | "View in English" | `/not-found.tsx` | 5 (hardcoded igual em todas) |
| 3 | `src/components/AuthenticationScreen/AuthenticationScreen.tsx` | 181 | "Login to Your Account" | `src/components/AuthenticationScreen/AuthenticationScreen.tsx` | 5 (hardcoded igual em todas) |
| 4 | `src/components/AuthenticationScreen/EmailAuthForm/EmailAuthForm.tsx` | 42 | "Email" | `src/components/AuthenticationScreen/EmailAuthForm/EmailAuthForm.tsx` | 5 (hardcoded igual em todas) |
| 5 | `src/components/AuthenticationScreen/EmailAuthForm/EmailAuthForm.tsx` | 54 | "Password" | `src/components/AuthenticationScreen/EmailAuthForm/EmailAuthForm.tsx` | 5 (hardcoded igual em todas) |
| 6 | `src/components/analytics/performance-monitor.tsx` | 131 | "LCP:" | `src/components/analytics/performance-monitor.tsx` | 5 (hardcoded igual em todas) |
| 7 | `src/components/analytics/performance-monitor.tsx` | 144 | "FCP:" | `src/components/analytics/performance-monitor.tsx` | 5 (hardcoded igual em todas) |
| 8 | `src/components/analytics/performance-monitor.tsx` | 157 | "CLS:" | `src/components/analytics/performance-monitor.tsx` | 5 (hardcoded igual em todas) |
| 9 | `src/components/analytics/performance-monitor.tsx` | 170 | "TTFB:" | `src/components/analytics/performance-monitor.tsx` | 5 (hardcoded igual em todas) |
| 10 | `src/components/analytics/performance-monitor.tsx` | 190 | "Count:" | `src/components/analytics/performance-monitor.tsx` | 5 (hardcoded igual em todas) |
| 11 | `src/components/analytics/performance-monitor.tsx` | 201 | "Size:" | `src/components/analytics/performance-monitor.tsx` | 5 (hardcoded igual em todas) |
| 12 | `src/components/analytics/performance-monitor.tsx` | 216 | "● Good" | `src/components/analytics/performance-monitor.tsx` | 5 (hardcoded igual em todas) |
| 13 | `src/components/analytics/performance-monitor.tsx` | 220 | "● Poor" | `src/components/analytics/performance-monitor.tsx` | 5 (hardcoded igual em todas) |
| 14 | `src/components/auth/dashboard.tsx` | 40 | "Loading..." | `src/components/auth/dashboard.tsx` | 5 (hardcoded igual em todas) |
| 15 | `src/components/auth/forgot-password-form.tsx` | 184 | "Email" | `src/components/auth/forgot-password-form.tsx` | 5 (hardcoded igual em todas) |
| 16 | `src/components/auth/login-form.tsx` | 296 | "Email" | `src/components/auth/login-form.tsx` | 5 (hardcoded igual em todas) |
| 17 | `src/components/auth/login-form.tsx` | 316 | "Password" | `src/components/auth/login-form.tsx` | 5 (hardcoded igual em todas) |
| 18 | `src/components/auth/protected-route.tsx` | 42 | "Loading..." | `src/components/auth/protected-route.tsx` | 5 (hardcoded igual em todas) |
| 19 | `src/components/auth/register-form.tsx` | 333 | "Name" | `src/components/auth/register-form.tsx` | 5 (hardcoded igual em todas) |
| 20 | `src/components/auth/register-form.tsx` | 360 | "Email" | `src/components/auth/register-form.tsx` | 5 (hardcoded igual em todas) |
| 21 | `src/components/auth/register-form.tsx` | 387 | "Password" | `src/components/auth/register-form.tsx` | 5 (hardcoded igual em todas) |
| 22 | `src/components/auth/register-form.tsx` | 428 | "Confirm Password" | `src/components/auth/register-form.tsx` | 5 (hardcoded igual em todas) |
| 23 | `src/components/auth/reset-password-form.tsx` | 278 | "New Password" | `src/components/auth/reset-password-form.tsx` | 5 (hardcoded igual em todas) |
| 24 | `src/components/auth/reset-password-form.tsx` | 310 | "Confirm New Password" | `src/components/auth/reset-password-form.tsx` | 5 (hardcoded igual em todas) |
| 25 | `src/components/dashboard/groups/channel-group-manager.tsx` | 167 | "New Group" | `src/components/dashboard/groups/channel-group-manager.tsx` | 5 (hardcoded igual em todas) |
| 26 | `src/components/dashboard/live/chat-message-list.tsx` | 50 | "No chat messages yet" | `src/components/dashboard/live/chat-message-list.tsx` | 5 (hardcoded igual em todas) |
| 27 | `src/components/dashboard/live/stream-health-card.tsx` | 45 | "Bitrate" | `src/components/dashboard/live/stream-health-card.tsx` | 5 (hardcoded igual em todas) |
| 28 | `src/components/dashboard/live/stream-health-card.tsx` | 51 | "Frame Rate" | `src/components/dashboard/live/stream-health-card.tsx` | 5 (hardcoded igual em todas) |
| 29 | `src/components/dashboard/live/stream-health-card.tsx` | 57 | "Latency" | `src/components/dashboard/live/stream-health-card.tsx` | 5 (hardcoded igual em todas) |
| 30 | `src/components/dashboard/live/stream-health-card.tsx` | 63 | "Dropped Frames" | `src/components/dashboard/live/stream-health-card.tsx` | 5 (hardcoded igual em todas) |
| 31 | `src/components/dashboard/live/stream-health-card.tsx` | 72 | "Issues Detected:" | `src/components/dashboard/live/stream-health-card.tsx` | 5 (hardcoded igual em todas) |
| 32 | `src/components/dashboard/live/stream-status-card.tsx` | 197 | "Tempo no Ar" | `src/components/dashboard/live/stream-status-card.tsx` | 5 (hardcoded igual em todas) |
| 33 | `src/components/dashboard/live/stream-status-card.tsx` | 206 | "Game" | `src/components/dashboard/live/stream-status-card.tsx` | 5 (hardcoded igual em todas) |
| 34 | `src/components/dashboard/live/stream-status-card.tsx` | 229 | "Encoder & Res" | `src/components/dashboard/live/stream-status-card.tsx` | 5 (hardcoded igual em todas) |
| 35 | `src/components/dashboard/live/stream-title-editor.tsx` | 262 | "Sincronizando com a plataforma..." | `src/components/dashboard/live/stream-title-editor.tsx` | 5 (hardcoded igual em todas) |
| 36 | `src/components/history/PublicationHistory.tsx` | 123 | "Publication History" | `src/components/history/PublicationHistory.tsx` | 5 (hardcoded igual em todas) |
| 37 | `src/components/history/PublicationHistory.tsx` | 152 | "All Networks" | `src/components/history/PublicationHistory.tsx` | 5 (hardcoded igual em todas) |
| 38 | `src/components/history/PublicationHistory.tsx` | 172 | "All Status" | `src/components/history/PublicationHistory.tsx` | 5 (hardcoded igual em todas) |
| 39 | `src/components/history/PublicationHistory.tsx` | 173 | "Success" | `src/components/history/PublicationHistory.tsx` | 5 (hardcoded igual em todas) |
| 40 | `src/components/history/PublicationHistory.tsx` | 174 | "Failed" | `src/components/history/PublicationHistory.tsx` | 5 (hardcoded igual em todas) |
| 41 | `src/components/history/PublicationHistory.tsx` | 175 | "Pending" | `src/components/history/PublicationHistory.tsx` | 5 (hardcoded igual em todas) |
| 42 | `src/components/registration/EmailInput.stories.tsx` | 41 | "Value:" | `src/components/registration/EmailInput.stories.tsx` | 5 (hardcoded igual em todas) |
| 43 | `src/components/registration/EmailInput.stories.tsx` | 44 | "Valid:" | `src/components/registration/EmailInput.stories.tsx` | 5 (hardcoded igual em todas) |
| 44 | `src/components/registration/GoogleOAuthFlow.tsx` | 250 | "Authorizing..." | `src/components/registration/GoogleOAuthFlow.tsx` | 5 (hardcoded igual em todas) |
| 45 | `src/components/registration/GoogleOAuthFlow.tsx` | 266 | "Authorize with Google" | `src/components/registration/GoogleOAuthFlow.tsx` | 5 (hardcoded igual em todas) |
| 46 | `src/components/registration/PasswordSetup.stories.tsx` | 50 | "Password:" | `src/components/registration/PasswordSetup.stories.tsx` | 5 (hardcoded igual em todas) |
| 47 | `src/components/registration/PasswordSetup.stories.tsx` | 53 | "Confirm:" | `src/components/registration/PasswordSetup.stories.tsx` | 5 (hardcoded igual em todas) |
| 48 | `src/components/registration/PasswordSetup.stories.tsx` | 57 | "Valid:" | `src/components/registration/PasswordSetup.stories.tsx` | 5 (hardcoded igual em todas) |
| 49 | `src/components/registration/PersonalDataForm.stories.tsx` | 48 | "Name:" | `src/components/registration/PersonalDataForm.stories.tsx` | 5 (hardcoded igual em todas) |
| 50 | `src/components/registration/PersonalDataForm.stories.tsx` | 51 | "Phone:" | `src/components/registration/PersonalDataForm.stories.tsx` | 5 (hardcoded igual em todas) |
| 51 | `src/components/registration/PersonalDataForm.stories.tsx` | 54 | "Valid:" | `src/components/registration/PersonalDataForm.stories.tsx` | 5 (hardcoded igual em todas) |
| 52 | `src/components/seo/structured-data.tsx` | 40 | "/ Array" | `src/components/seo/structured-data.tsx` | 5 (hardcoded igual em todas) |
| 53 | `src/components/ui/badge.stories.tsx` | 37 | "Default" | `src/components/ui/badge.stories.tsx` | 5 (hardcoded igual em todas) |
| 54 | `src/components/ui/badge.stories.tsx` | 38 | "Secondary" | `src/components/ui/badge.stories.tsx` | 5 (hardcoded igual em todas) |
| 55 | `src/components/ui/badge.stories.tsx` | 39 | "Destructive" | `src/components/ui/badge.stories.tsx` | 5 (hardcoded igual em todas) |
| 56 | `src/components/ui/badge.stories.tsx` | 40 | "Outline" | `src/components/ui/badge.stories.tsx` | 5 (hardcoded igual em todas) |
| 57 | `src/components/ui/badge.stories.tsx` | 64 | "Feature Name" | `src/components/ui/badge.stories.tsx` | 5 (hardcoded igual em todas) |
| 58 | `src/components/ui/badge.stories.tsx` | 65 | "Beta" | `src/components/ui/badge.stories.tsx` | 5 (hardcoded igual em todas) |
| 59 | `src/components/ui/badge.stories.tsx` | 68 | "Product Status" | `src/components/ui/badge.stories.tsx` | 5 (hardcoded igual em todas) |
| 60 | `src/components/ui/badge.stories.tsx` | 69 | "Out of Stock" | `src/components/ui/badge.stories.tsx` | 5 (hardcoded igual em todas) |

> Dica: rode grep -rn '>[A-ZÁÂÃ].*<' src/app src/components --include="*.tsx" | grep -v 't(' → lista completa. Melhor ainda: regra eslint no-restricted-syntax para JSXText sem t().

## 9) Riscos e dívidas técnicas

- **SEO/metadata não traduzido**: generateSeoConfig/generateMetadata em about-me, channel-management, editors, pc-optimization usam title/desc hardcoded EN (openGraph locale fixo) — afeta hreflang/sitemap por idioma.
- **Breadcrumbs hardcoded**: channelManagementBreadcrumbs, editorsBreadcrumbs, pcOptimizationBreadcrumbs constroem labels via t("breadcrumbs.*") mas breadcrumbs.json não está em messages — fallback silencioso para EN.
- **Duplicação de rotas**: legado src/app/<slug>/page.tsx fora de [locale] compete com [locale]/<slug> — risco de 404/conteúdo duplicado para crawlers.
- **Placeholders residuais**: mesmo componentes com i18n ainda têm strings literais em placeholder/title/aria-label (ex: dashboard/cloner, discover) — quebra em de/fr.
- **Sem lint guard**: nenhuma regra impede novo JSX hardcoded; i18n:validate só checa paridade de chaves, não uso.
- **Nova língua = 6 toques manuais**: locales[], request.ts, url-mapping.ts, wrappers físicos, middleware SUPPORTED_LOCALES, sitemap — sem gerador, fácil esquecer um.

## 10) Padrões para novas línguas

### 10.1 Adicionar um locale (ex: it)

1. **src/lib/i18n.ts**: adicione "it" em `locales` + `localeNames`/`localeNamesShort`.
2. **src/i18n/it/**: copie `src/i18n/en/**` (34 .json + questions/9) e traduza; mantenha chaves idênticas (flatten keys iguais). Use `npm run i18n:validate` para garantir paridade.
3. **src/i18n/request.ts**: se criou novo namespace, adicione `loadJson(() => import(`@/i18n/${selectedLocale}/<ns>.json`))` + entrada em `messages`.
4. **src/lib/url-mapping.ts**: adicione entrada `it: { "about-me": "chi-sono", ... }` para cada slug localizado.
5. **Wrappers**: crie `src/app/[locale]/<slug-it>/page.tsx` para cada slug traduzido (copie de outro wrapper, só mude import). Ex: `chi-sono/page.tsx` → `export { default } from "../about-me/page"`.
6. **middleware.ts**: adicione "it" em `SUPPORTED_LOCALES`.
7. **Sitemap/SEO**: adicione `sitemap-it.xml` + hreflang em generateSeoConfig.
8. **Valide**: `npm run i18n:validate && npm run i18n:check-params && npm run type-check && npm test`.

### 10.2 Criar nova página com i18n (template)

```tsx
// src/app/[locale]/minha-pagina/page.tsx
import { getTranslations } from "next-intl/server";
import { type Locale } from "@/lib/i18n";
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "minhaPagina" });
  return { title: t("seo.title"), description: t("seo.description") };
}
export default async function MinhaPagina({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "minhaPagina" });
  return <h1>{t("hero.title")}</h1>;
}
```

### 10.3 Componente com i18n (template)

```tsx
"use client";
import { useTranslations } from "next-intl";
export function MeuCard() {
  const t = useTranslations("dashboard.meuCard");
  return <button aria-label={t("cta.aria")} title={t("cta.title")}>{t("cta.label")}</button>;
}
```

Regras:
- Nunca hardcodear copy em JSX: sempre `t("namespace.chave")`.
- Placeholders, aria-label, title, alt, empty states, toasts, erros — tudo via t().
- Placeholders dinâmicos: `t("hello", { name })` + `{name}` no JSON; validar com `i18n:check-params`.
- Não criar namespace novo sem adicionar em request.ts messages map.
- Preferir namespaces existentes (auth, dashboard.*, seo, breadcrumbs) antes de criar novo.

### 10.4 Namespaces — quando criar vs reutilizar

| Já existe | Use para |
|---|---|
| auth | login, register, complete-account, forgot-password, reset-password |
| dashboard.* | channels, cloner, credits, discover, insights, live, publish, repost, settings, common |
| home / landing / aboutMe / editors / channelManagement / pcOptimization / services / minecraft* | páginas públicas |
| seo / breadcrumbs | SEO e navegação (após corrigir §7#15) |

Crie novo namespace só se a página for isolada (ex: blog.json, obs.json, payments.json, docs.json) e adicione em request.ts.

## 11) Checklist de PR i18n

- [ ] Nenhum JSXText/placeholder/aria-label hardcoded (grep `>[A-Z].*<' | grep -v t() = 0 ou justificado)
- [ ] Toda copy via `useTranslations` (client) ou `getTranslations` (server) com namespace existente em request.ts
- [ ] Se novo namespace: adicionado em request.ts messages map + JSON criado em 5 locales
- [ ] Se novo slug localizado: wrapper criado em src/app/[locale]/<slug>/page.tsx + url-mapping.ts atualizado
- [ ] Se novo locale: §10.1 completo (i18n.ts, request.ts, url-mapping, wrappers, middleware, sitemap)
- [ ] `npm run i18n:validate` e `npm run i18n:check-params` verdes
- [ ] Metadata/SEO traduzido (generateMetadata usa t(), og locale correto, hreflang)
- [ ] Breadcrumbs traduzidos (breadcrumbs.json em messages)
- [ ] Testes com next-intl mock (`src/test-utils/next-intl-mock.ts`) atualizados se necessário

## 12) Plano de correção priorizado

| Fase | Escopo | Estimativa | Critério de pronto |
|---|---|---|---|
| 1 — P0 | blog (2 pages) + login/register (2) + obs + payments/checkout + chat-popout | 1–2 dias | Todas P0 com t() + namespaces, i18n:validate verde, sem hardcoded em grep |
| 2 — P1 metadata | about-me, channel-management, editors, pc-optimization: mover metadata/SEO para t() | 1 dia | generateMetadata usa getTranslations, og locale por locale, hreflang ok |
| 3 — P1 infra | breadcrumbs.json + seo.json em messages map + consumir via t() | 0.5 dia | request.ts carrega ambos, breadcrumbs traduzidos, seo.json usado em generateSeoConfig |
| 4 — P1 legado | Remover/redirect src/app/<slug> fora de [locale] (7 pastas) + /dashboard/settings duplicata | 0.5 dia | Sem duplicatas, middleware cobre, sem 404 |
| 5 — P1 polish | registration/*, auth/*, dashboard placeholders residuais | 1 dia | Todo placeholder/title/aria via t() |
| 6 — Guardrails | ESLint rule JSXText sem t() + CI i18n:validate/check-params obrigatório | 0.5 dia | PR falha se hardcoded |
| 7 — Nova língua | Gerador `scripts/new-locale.mjs <code>` automatizando §10.1 | 0.5 dia | Rodar e ter locale novo verde |

**Sugestão de melhoria (aberta):** em vez de wrappers físicos por slug, considere roteamento via `[locale]/[slug]` dinâmico + url-mapping lookup no middleware (rewrite), eliminando 37 arquivos boilerplate. Troca: menos arquivos vs. complexidade de rewrite + sitemap dinâmico. Para já, manter wrappers é o menor risco.

## A) Apêndice — comandos de validação

```bash
npm run i18n:validate          # paridade de chaves vs en (flatten)
npm run i18n:check-params       # placeholders {var} consistentes entre locales
npm run i18n:check-params -- --report  # relatório detalhado
npx tsc --noEmit                # tipos (Locale, messages)
# Varredura manual de hardcoded:
grep -rn '>[A-ZÁÂÃ].*<' src/app src/components --include='*.tsx' | grep -v 't(' | head
grep -rn 'placeholder=\|aria-label=\|title=' src --include='*.tsx' | grep -v 't(' | head
# Páginas sem i18n direto:
grep -rL 'useTranslations\|getTranslations' src/app --include='*.tsx' | grep page.tsx
# Namespaces não carregados:
comm -23 <(ls src/i18n/en/*.json | xargs -I{} basename {} | sort) <(grep -oP '@\/i18n/\\\$\{selectedLocale\}/\K[^"}]+' src/i18n/request.ts | sort)
```

---

**Próximo passo recomendado:** começar pela Fase 1 (P0) — blog + auth + obs/checkout/popout — e já na mesma PR corrigir Fase 3 (breadcrumbs/seo em messages), pois destrava breadcrumbs traduzidos para Fase 2.
