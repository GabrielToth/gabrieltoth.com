import { type Locale } from "@/lib/i18n"
import { BarChart3, DollarSign, Target, Video } from "lucide-react"

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

/**
 * Get translations for channel management page based on locale
 */
export function getChannelManagementTranslations(
    locale: Locale
): ChannelManagementTranslations {
    const t = translations[locale] || translations.en

    // Augment the loaded JSON with icon components for services
    return {
        ...t,
        services: {
            ...t.services,
            items: t.services.items.map((item: any, index: number) => {
                const icons = [BarChart3, Video, DollarSign, Target]
                return { ...item, icon: icons[index] }
            }),
        },
    }
}
