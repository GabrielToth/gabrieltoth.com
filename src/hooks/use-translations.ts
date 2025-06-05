'use client'

import enTranslations from '@/i18n/en.json'
import ptTranslations from '@/i18n/pt-BR.json'
import { getLocaleFromUrl } from '@/lib/i18n'
import { usePathname } from 'next/navigation'

const translations = {
    en: enTranslations,
    'pt-BR': ptTranslations,
}

export const useTranslations = () => {
    const pathname = usePathname()
    const locale = getLocaleFromUrl(pathname)

    const t = (key: string): string => {
        const keys = key.split('.')
        let value: unknown = translations[locale]

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = (value as Record<string, unknown>)[k]
            } else {
                return key
            }
        }

        return typeof value === 'string' ? value : key
    }

    return { t, locale }
}
