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

function isValidPath(path: string): boolean {
    // Define valid paths (without locale)
    const validPaths = [
        "",
        "/",
        "/channel-management",
        "/investments",
        "/payment-demo",
        "/pc-optimization",
        "/social-analytics-investment",
        "/waveigl-support",
        "/editors",
        "/privacy-policy",
        "/terms-of-service",
    ]

    return validPaths.includes(path) || path.startsWith("/api/")
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Skip API routes, static files, etc.
    if (
        pathname.startsWith("/api/") ||
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.includes(".")
    ) {
        return
    }

    // Check if this is a retry attempt (to avoid infinite loops)
    const isRetryAttempt =
        request.headers.get("x-url-correction-attempt") === "true"

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

    // Case 1: URL has invalid locale but valid path
    if (!hasValidLocale && !isRetryAttempt && isValidPath(restOfPath)) {
        // Try to redirect to correct locale + path
        const correctedUrl = new URL(
            `/${currentLocale}${restOfPath}`,
            request.url
        )

        const response = NextResponse.redirect(correctedUrl)
        response.headers.set("x-url-correction-attempt", "true")
        return response
    }

    // Case 2: URL has no locale at all and is a valid path
    if (pathSegments.length > 0 && !hasValidLocale && isValidPath(pathname)) {
        const correctedUrl = new URL(
            `/${currentLocale}${pathname}`,
            request.url
        )
        return NextResponse.redirect(correctedUrl)
    }

    // Case 3: URL has valid locale but invalid path - let it through to show 404
    if (hasValidLocale && !isValidPath(restOfPath)) {
        // Don't try to correct, let it show the 404 page
        const response = NextResponse.next()
        response.cookies.set("locale", potentialLocale, {
            maxAge: 365 * 24 * 60 * 60,
            path: "/",
            sameSite: "lax",
        })
        response.headers.set("x-locale", potentialLocale)
        return response
    }

    // Case 4: URL has invalid locale AND invalid path - let it show 404
    if (!hasValidLocale && !isValidPath(restOfPath) && !isRetryAttempt) {
        // Try once with detected locale
        const correctedUrl = new URL(
            `/${currentLocale}${restOfPath}`,
            request.url
        )

        const response = NextResponse.redirect(correctedUrl)
        response.headers.set("x-url-correction-attempt", "true")
        return response
    }

    // Default behavior - create response with locale detection
    const response = NextResponse.next()

    // Determine which locale to use
    const localeToUse = hasValidLocale ? potentialLocale : currentLocale

    // Set the locale in a cookie (expires in 1 year)
    response.cookies.set("locale", localeToUse, {
        maxAge: 365 * 24 * 60 * 60,
        path: "/",
        sameSite: "lax",
    })

    // Set a header so we can access the locale in components
    response.headers.set("x-locale", localeToUse)

    return response
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
