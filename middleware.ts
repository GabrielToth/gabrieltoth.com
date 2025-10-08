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
        "/channel-management": "/pt-BR/channel-management",
        "/editors": "/pt-BR/editors",
        "/pc-optimization": "/pt-BR/pc-optimization",
        "/privacy-policy": "/pt-BR/privacy-policy",
        "/terms-of-service": "/pt-BR/terms-of-service",
    }

    if (staticRedirectMap[pathname]) {
        const to = staticRedirectMap[pathname]
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
