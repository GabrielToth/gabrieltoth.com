import { type Locale } from "@/lib/i18n"

// Import all translation files
import de from "./de.json"
import en from "./en.json"
import es from "./es.json"
import ptBR from "./pt-BR.json"

// Translation type based on the structure
export type HeaderTranslations = typeof en

// Translation map
const translations: Record<Locale, HeaderTranslations> = {
    en,
    "pt-BR": ptBR,
    es,
    de,
}

/**
 * Get translations for the header based on locale
 */
export function getHeaderTranslations(locale: Locale): HeaderTranslations {
    return translations[locale] || translations.en
}
