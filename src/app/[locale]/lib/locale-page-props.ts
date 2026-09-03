import type { Locale } from "@/lib/i18n"

/**
 * Shared props type for locale-prefixed pages in App Router.
 * Uses Promise-wrapped params (Next.js 15+ convention).
 */
export interface LocalePageProps {
    params: Promise<{ locale: Locale }>
}
