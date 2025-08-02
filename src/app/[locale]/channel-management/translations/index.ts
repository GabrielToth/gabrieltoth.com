import { type Locale } from "@/lib/i18n"

// Import all translation files
import de from "./de.json"
import en from "./en.json"
import es from "./es.json"
import ptBR from "./pt-BR.json"

// Translation type based on the structure
export type ChannelManagementTranslations = typeof en

// Translation map
const translations: Record<Locale, ChannelManagementTranslations> = {
    en,
    "pt-BR": ptBR,
    es,
    de,
}

export function getChannelManagementTranslations(
    locale: Locale
): ChannelManagementTranslations {
    return translations[locale] || translations.en
}
