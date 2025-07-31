"use client"

import {
    defaultLocale,
    detectBrowserLanguage,
    getLocaleFromCookie,
    locales,
    setLocaleCookie,
    type Locale,
} from "@/lib/i18n"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Global state para sincronizar entre instâncias
let globalLocale: Locale | null = null
const globalListeners: Set<(locale: Locale) => void> = new Set()

const notifyListeners = (locale: Locale) => {
    globalLocale = locale
    globalListeners.forEach(listener => listener(locale))
}

export function useLocale() {
    const router = useRouter()
    const pathname = usePathname()

    // Inicializar com o valor global se disponível
    const [locale, setLocale] = useState<Locale>(globalLocale || defaultLocale)
    const [isLoading, setIsLoading] = useState(!globalLocale)

    useEffect(() => {
        // Extract locale from current pathname
        const pathSegments = pathname.split("/").filter(Boolean)
        const currentPathLocale = pathSegments[0]

        if (
            currentPathLocale &&
            locales.includes(currentPathLocale as Locale)
        ) {
            if (globalLocale !== currentPathLocale) {
                globalLocale = currentPathLocale as Locale
                setLocale(currentPathLocale as Locale)
                setLocaleCookie(currentPathLocale as Locale)
            }
            setIsLoading(false)
            return
        }

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
    }, [pathname])

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

        // Update URL to include new locale
        const pathSegments = pathname.split("/").filter(Boolean)
        const currentPathLocale = pathSegments[0]

        let newPath: string
        if (locales.includes(currentPathLocale as Locale)) {
            // Replace existing locale
            pathSegments[0] = newLocale
            newPath = "/" + pathSegments.join("/")
        } else {
            // Add locale to path
            newPath = `/${newLocale}${pathname}`
        }

        // Notificar todas as instâncias
        notifyListeners(newLocale)

        // Navigate to new URL
        router.push(newPath)
    }

    return {
        locale,
        changeLocale,
        isLoading,
    }
}
