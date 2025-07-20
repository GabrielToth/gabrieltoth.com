import { type Locale } from "@/lib/i18n"

// Import all translation files
import de from "./de.json"
import en from "./en.json"
import es from "./es.json"
import ptBR from "./pt-BR.json"

// Translation type based on the structure
export type PrivacyPolicyTranslations = typeof en

// Translation map
const translations: Record<Locale, PrivacyPolicyTranslations> = {
    en,
    "pt-BR": ptBR,
    es,
    de,
}

/**
 * Get translations for privacy policy page based on locale
 */
export function getPrivacyPolicyTranslations(
    locale: Locale
): PrivacyPolicyTranslations {
    return translations[locale] || translations.en
}
