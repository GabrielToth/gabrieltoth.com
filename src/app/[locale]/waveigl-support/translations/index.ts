import { type Locale } from "@/lib/i18n"

// Import all translation files
import de from "./de.json"
import en from "./en.json"
import es from "./es.json"
import ptBR from "./pt-BR.json"

// Translation type based on the structure
export type WaveIGLSupportTranslations = typeof en

// Translation map
const translations: Record<Locale, WaveIGLSupportTranslations> = {
    en,
    "pt-BR": ptBR,
    es,
    de,
}

/**
 * Get translations for WaveIGL support page based on locale
 */
export function getWaveIGLSupportTranslations(
    locale: Locale
): WaveIGLSupportTranslations {
    return translations[locale] || translations.en
}
