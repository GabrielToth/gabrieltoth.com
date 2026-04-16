import { defaultLocale, locales } from "@/lib/i18n"
import { NextRequest, NextResponse } from "next/server"

function getLocaleFromAcceptLanguage(acceptLanguage: string): string {
    // Parse Accept-Language header
    const languages = acceptLanguage
        .split(",")
        .map(lang => {
            const [code, q = "1"] = lang.trim().split(";q=")
            return { code: code.trim(), quality: parseFloat(q) }
        })
        .sort((a, b) => b.quality - a.quality)

    // Check if any preferred language matches our supported locales
    for (const { code } of languages) {
        // Check exact match first
        if (locales.includes(code as any)) {
            return code
        }

        // Check language prefix (e.g., 'pt' from 'pt-BR')
        const langPrefix = code.split("-")[0]
        const matchingLocale = locales.find(locale =>
            locale.startsWith(langPrefix)
        )
        if (matchingLocale) {
            return matchingLocale
        }
    }

    return defaultLocale
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Host canonicalization handled by Next.js redirects; avoid double redirects here

    // Skip API routes, static files, etc.
    if (
        pathname.startsWith("/api/") ||
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.includes(".")
    ) {
        return
    }

    // Permanent redirects for non-locale canonical routes
    const staticRedirectMap: Record<string, string> = {
        "/": "/pt-BR",
        "/channel-management": "/pt-BR/gerenciamento-de-canais",
        "/editors": "/pt-BR/editores",
        "/pc-optimization": "/pt-BR/otimizacao-de-pc",
        "/privacy-policy": "/pt-BR/politica-de-privacidade",
        "/terms-of-service": "/pt-BR/termos-de-servico",
    }

    // Old URL redirects to new translated URLs (308 Permanent Redirect)
    // Note: login, register, and payments are handled by rewrites in next.config.ts
    const oldUrlRedirectMap: Record<string, string> = {
        // PT-BR old URLs
        "/pt-BR/channel-management": "/pt-BR/gerenciamento-de-canais",
        "/pt-BR/editors": "/pt-BR/editores",
        "/pt-BR/pc-optimization": "/pt-BR/otimizacao-de-pc",
        "/pt-BR/privacy-policy": "/pt-BR/politica-de-privacidade",
        "/pt-BR/terms-of-service": "/pt-BR/termos-de-servico",
        "/pt-BR/iq-test": "/pt-BR/teste-de-qi",
        "/pt-BR/personality-test": "/pt-BR/teste-de-personalidade",
        "/pt-BR/amazon-affiliate": "/pt-BR/afiliados-amazon",

        // ES old URLs
        "/es/channel-management": "/es/gestion-de-canales",
        "/es/editors": "/es/editores",
        "/es/pc-optimization": "/es/optimizacion-de-pc",
        "/es/privacy-policy": "/es/politica-de-privacidad",
        "/es/terms-of-service": "/es/terminos-de-servicio",
        "/es/iq-test": "/es/prueba-de-ci",
        "/es/personality-test": "/es/prueba-de-personalidad",
        "/es/amazon-affiliate": "/es/afiliados-amazon",

        // DE old URLs
        "/de/channel-management": "/de/kanalverwaltung",
        "/de/editors": "/de/editoren",
        "/de/pc-optimization": "/de/pc-optimierung",
        "/de/privacy-policy": "/de/datenschutzrichtlinie",
        "/de/terms-of-service": "/de/nutzungsbedingungen",
        "/de/iq-test": "/de/iq-test",
        "/de/personality-test": "/de/personlichkeitstest",
        "/de/amazon-affiliate": "/de/amazon-partner",
    }

    // Redirect old locale-specific about page to language-independent URL
    const localeSpecificRedirectMap: Record<string, string> = {
        "/pt-BR/quem-sou-eu": "/gabriel-toth-goncalves",
        "/en/about-me": "/gabriel-toth-goncalves",
        "/es/acerca-de-mi": "/gabriel-toth-goncalves",
        "/de/uber-mich": "/gabriel-toth-goncalves",
    }

    if (staticRedirectMap[pathname]) {
        const to = staticRedirectMap[pathname]
        const correctedUrl = new URL(
            to.endsWith("/") ? to : `${to}/`,
            request.url
        )
        return NextResponse.redirect(correctedUrl, 308)
    }

    // Check for old URL redirects
    if (oldUrlRedirectMap[pathname]) {
        const to = oldUrlRedirectMap[pathname]
        const correctedUrl = new URL(
            to.endsWith("/") ? to : `${to}/`,
            request.url
        )
        return NextResponse.redirect(correctedUrl, 308)
    }

    // Check for locale-specific redirects
    if (localeSpecificRedirectMap[pathname]) {
        const to = localeSpecificRedirectMap[pathname]
        const correctedUrl = new URL(
            to.endsWith("/") ? to : `${to}/`,
            request.url
        )
        return NextResponse.redirect(correctedUrl, 308)
    }

    // Parse URL to check if it has a locale
    const pathSegments = pathname.split("/").filter(Boolean)
    const potentialLocale = pathSegments[0]
    const restOfPath = "/" + pathSegments.slice(1).join("/")

    // Check if the potential locale is valid
    const hasValidLocale = locales.includes(potentialLocale as any)

    // Get current locale from cookie or detect from Accept-Language
    let currentLocale = request.cookies.get("locale")?.value

    if (!currentLocale || !locales.includes(currentLocale as any)) {
        const acceptLanguage = request.headers.get("accept-language") || ""
        currentLocale = getLocaleFromAcceptLanguage(acceptLanguage)
    }

    // Case 1: (handled above for "/")

    // Case 2: URL has no locale - redirect to include locale (non-static)
    if (
        !hasValidLocale &&
        !pathname.startsWith("/api/") &&
        !pathname.startsWith("/_next/") &&
        !pathname.includes(".")
    ) {
        const destination = `/${currentLocale}${pathname}`
        const correctedUrl = new URL(
            destination.endsWith("/") ? destination : `${destination}/`,
            request.url
        )
        return NextResponse.redirect(correctedUrl, 308)
    }

    // Case 3: URL has valid locale - proceed normally
    if (hasValidLocale) {
        return NextResponse.next()
    }

    // Default behavior - create response with locale detection
    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
