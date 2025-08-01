import { type Locale } from "@/lib/i18n"

// Import all translation files
import de from "./de.json"
import en from "./en.json"
import es from "./es.json"
import ptBR from "./pt-BR.json"

// Internal type for testimonial items
interface TestimonialItem {
    name: string
    role: string
    content: string
    rating?: number
}

const translations = {
    en,
    "pt-BR": ptBR,
    es,
    de,
}

/**
 * Interface for editor translations without icon injection
 */
export type EditorsTranslations = typeof en

/**
 * Get translations for editors page based on locale
 */
export function getEditorsTranslations(locale: Locale): EditorsTranslations {
    const t = translations[locale] || translations.en

    // Return translations with rating added to testimonials only
    return {
        ...t,
        testimonials: {
            ...t.testimonials,
            items:
                t.testimonials?.items?.map((item: TestimonialItem) => ({
                    ...item,
                    rating: item.rating || 5,
                })) || [],
        },
    }
}
