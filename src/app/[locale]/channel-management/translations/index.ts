import { type Locale } from "@/lib/i18n"
import { SiYoutube } from "@icons-pack/react-simple-icons"
import { BarChart3, DollarSign, Target, TrendingUp, Video } from "lucide-react"

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
export interface ChannelManagementTranslations {
    [key: string]: any
}

export function getChannelManagementTranslations(
    locale: Locale
): ChannelManagementTranslations {
    const t = translations[locale] || translations.en

    // Augment the loaded JSON with icon components
    return {
        ...t,
        personalAbout: {
            ...t.personalAbout,
            skills:
                t.personalAbout?.skills?.map((skill: string, index: number) => {
                    const icons = [
                        BarChart3,
                        Video,
                        DollarSign,
                        TrendingUp,
                        SiYoutube,
                        Target,
                    ]
                    return { icon: icons[index], name: skill }
                }) || [],
        },
        problems: {
            ...t.problems,
            items:
                t.problems?.items?.map((item: any, index: number) => {
                    const icons = [TrendingUp, BarChart3, DollarSign, Target]
                    return { ...item, icon: icons[index] }
                }) || [],
        },
        services: {
            ...t.services,
            items:
                t.services?.items?.map((item: any, index: number) => {
                    const icons = [BarChart3, Video, DollarSign, Target]
                    return { ...item, icon: icons[index] }
                }) || [],
        },
    }
}
