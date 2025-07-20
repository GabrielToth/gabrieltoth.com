import { type Locale } from "@/lib/i18n"

// Import all translation files
import de from "./de.json"
import en from "./en.json"
import es from "./es.json"
import ptBR from "./pt-BR.json"

// Translation type based on the structure
export type HomeTranslations = typeof en

// Translation map
const translations: Record<Locale, HomeTranslations> = {
    en,
    "pt-BR": ptBR,
    es,
    de,
}

/**
 * Get translations for the home page based on locale
 */
export function getHomeTranslations(locale: Locale): HomeTranslations {
    return translations[locale] || translations.en
}

// Export individual sections for convenience
export function getHeroTranslations(locale: Locale) {
    return getHomeTranslations(locale).hero
}

export function getAboutTranslations(locale: Locale) {
    return getHomeTranslations(locale).about
}

export function getContactTranslations(locale: Locale) {
    return getHomeTranslations(locale).contact
}
