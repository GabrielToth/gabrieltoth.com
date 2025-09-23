export const locales = ["en", "pt-BR", "es", "de"] as const

export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
    en: "English",
    "pt-BR": "Português",
    /* cspell:disable-next-line */
    es: "Español",
    /* cspell:disable-next-line */
    de: "Deutsch",
}

// Short versions for language selector to avoid text overflow
export const localeNamesShort: Record<Locale, string> = {
    en: "EN",
    "pt-BR": "PT",
    es: "ES",
    de: "DE",
}

export const defaultLocale: Locale = "pt-BR"

// Get locale from cookie (client-side)
export const getLocaleFromCookie = (): Locale => {
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
    if (typeof window === "undefined") return

    const cookieString = `locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=lax`
    document.cookie = cookieString
}

// Get locale from URL pathname (legacy support)
export const getLocaleFromUrl = (pathname: string): Locale => {
    const segments = pathname.split("/")
    const localeSegment = segments[1]

    if (locales.includes(localeSegment as Locale)) {
        return localeSegment as Locale
    }

    return defaultLocale
}

export const getLocalizedPath = (path: string): string => {
    // Remove any existing locale from the path
    const cleanPath = path.replace(/^\/(en|pt-BR|es|de)/, "") || "/"
    return cleanPath
}

// Detect browser language
export const detectBrowserLanguage = (): Locale => {
    if (typeof window === "undefined") return defaultLocale

    const browserLang =
        navigator.language || navigator.languages?.[0] || defaultLocale

    // Check exact match first
    if (locales.includes(browserLang as Locale)) {
        return browserLang as Locale
    }

    // Check language prefix (e.g., 'pt' from 'pt-BR')
    const langPrefix = browserLang.split("-")[0]
    const matchingLocale = locales.find(locale => locale.startsWith(langPrefix))

    const result = (matchingLocale as Locale) || defaultLocale
    return result
}
