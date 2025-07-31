import { type Locale } from "@/lib/i18n"
import { 
    Video, 
    Wand2, 
    Palette, 
    Volume2, 
    FileText, 
    Users, 
    Banknote, 
    Clock,
    Award,
    Star,
    CheckCircle
} from "lucide-react"

// Import all translation files
import de from "./de.json"
import en from "./en.json"
import es from "./es.json"
import ptBR from "./pt-BR.json"

const translations = {
    en,
    "pt-BR": ptBR,
    es,
    de,
}

/**
 * Interface for editor translations with icon injection
 */
export interface EditorsTranslations {
    [key: string]: any
}

/**
 * Get translations for editors page based on locale with icon injection
 */
export function getEditorsTranslations(locale: Locale): EditorsTranslations {
    const t = translations[locale] || translations.en

    // Icon mapping
    const iconMap: { [key: string]: any } = {
        Video,
        Wand2, 
        Palette,
        Volume2,
        FileText,
        Users,
        Banknote,
        Clock,
        Award,
        Star,
        CheckCircle
    }

    // Augment the loaded JSON with icon components
    return {
        ...t,
        about: {
            ...t.about,
            skills: t.about?.skills?.map((skill: any) => ({
                ...skill,
                icon: iconMap[skill.iconName] || Video
            })) || [],
        },
        tools: {
            ...t.tools,
            items: t.tools?.items?.map((item: any) => ({
                ...item,
                icon: iconMap[item.iconName] || Video
            })) || [],
        },
        services: {
            ...t.services,
            items: t.services?.items?.map((item: any) => ({
                ...item,
                icon: iconMap[item.iconName] || Video
            })) || [],
        },
        benefits: {
            ...t.benefits,
            items: t.benefits?.items?.map((item: any) => ({
                ...item,
                icon: iconMap[item.iconName] || CheckCircle
            })) || [],
        },
        testimonials: {
            ...t.testimonials,
            items: t.testimonials?.items?.map((item: any) => ({
                ...item,
                rating: item.rating || 5
            })) || [],
        }
    }
}
