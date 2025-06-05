export const defaultLocale = "en"
export const locales = ["en", "pt-BR"] as const

export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
    en: "English",
    "pt-BR": "Português",
}

export const getLocaleFromUrl = (pathname: string): Locale => {
    const segments = pathname.split("/")
    const localeSegment = segments[1]

    if (locales.includes(localeSegment as Locale)) {
        return localeSegment as Locale
    }

    return defaultLocale
}

export const getLocalizedPath = (path: string, locale: Locale): string => {
    if (locale === defaultLocale) {
        return path
    }
    return `/${locale}${path}`
}
