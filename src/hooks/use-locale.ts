"use client"

import {
    defaultLocale,
    detectBrowserLanguage,
    getLocaleFromCookie,
    setLocaleCookie,
    type Locale,
} from "@/lib/i18n"
import { useEffect, useState } from "react"

// Global state para sincronizar entre instâncias
let globalLocale: Locale | null = null
const globalListeners: Set<(locale: Locale) => void> = new Set()

const notifyListeners = (locale: Locale) => {
    globalLocale = locale
    globalListeners.forEach(listener => listener(locale))
}

export function useLocale() {
    // Inicializar com o valor global se disponível
    const [locale, setLocale] = useState<Locale>(globalLocale || defaultLocale)
    const [isLoading, setIsLoading] = useState(!globalLocale)

    useEffect(() => {
        // Se já temos o valor global, usar ele
        if (globalLocale) {
            setLocale(globalLocale)
            setIsLoading(false)
            return
        }

        // Get locale from cookie or detect from browser
        let currentLocale = getLocaleFromCookie()

        if (currentLocale === defaultLocale) {
            // If no cookie was set, try to detect browser language
            const browserLocale = detectBrowserLanguage()
            if (browserLocale !== defaultLocale) {
                currentLocale = browserLocale
                setLocaleCookie(currentLocale)
            }
        }

        // Definir valor global e local
        globalLocale = currentLocale
        setLocale(currentLocale)
        setIsLoading(false)
    }, [])

    // Registrar listener para mudanças globais
    useEffect(() => {
        const listener = (newLocale: Locale) => {
            setLocale(newLocale)
        }

        globalListeners.add(listener)

        return () => {
            globalListeners.delete(listener)
        }
    }, [])

    const changeLocale = (newLocale: Locale) => {
        setLocaleCookie(newLocale)

        // Notificar todas as instâncias
        notifyListeners(newLocale)
    }

    return {
        locale,
        changeLocale,
        isLoading,
    }
}
