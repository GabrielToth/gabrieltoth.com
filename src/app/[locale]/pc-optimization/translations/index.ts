import { type Locale } from "@/lib/i18n"

// Import all translation files
import de from "./de.json"
import en from "./en.json"
import es from "./es.json"
import ptBR from "./pt-BR.json"

// Translation type based on the structure
export type PCOptimizationTranslations = typeof en

// Translation map
const translations: Record<Locale, PCOptimizationTranslations> = {
    en,
    "pt-BR": ptBR,
    es,
    de,
}

/**
 * Get translations for PC optimization page based on locale
 */
export function getPCOptimizationTranslations(
    locale: Locale
): PCOptimizationTranslations {
    return translations[locale] || translations.en
}
