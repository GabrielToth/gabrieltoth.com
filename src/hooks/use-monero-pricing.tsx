"use client"

import de from "@/i18n/de/channelManagement.json"
import en from "@/i18n/en/channelManagement.json"
import es from "@/i18n/es/channelManagement.json"
import pt from "@/i18n/pt-BR/channelManagement.json"
import { type Locale } from "@/lib/i18n"
import React, { createContext, useContext, useState } from "react"

interface MoneroToggleConfig {
    title: string
    description: string
    enabled: string
    disabled: string
    currencySymbol?: string
    conversionRate?: number
}

interface ChannelManagementNs {
    moneroToggle?: MoneroToggleConfig
}

interface MoneroPricingContextType {
    showMoneroPrice: boolean
    toggleMoneroPrice: () => void
    calculatePrice: (
        baseMoneroPrice: number,
        locale?: Locale
    ) => {
        displayPrice: number
        originalPrice: number | null
        currency: string
        discount: number
        isMonero: boolean
    }
}

const MoneroPricingContext = createContext<
    MoneroPricingContextType | undefined
>(undefined)

export function MoneroPricingProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const [showMoneroPrice, setShowMoneroPrice] = useState(true)

    const toggleMoneroPrice = () => {
        setShowMoneroPrice(!showMoneroPrice)
    }

    const calculatePrice = (
        baseMoneroPrice: number,
        locale: Locale = "pt-BR"
    ) => {
        // Currency and conversion logic by locale (from i18n)
        const localesMap = { en, "pt-BR": pt, es, de } as const
        const ns = localesMap[
            locale as keyof typeof localesMap
        ] as unknown as ChannelManagementNs
        const currency = (ns.moneroToggle as MoneroToggleConfig).currencySymbol!
        const conversionRate = (ns.moneroToggle as MoneroToggleConfig)
            .conversionRate!

        const convertedMoneroPrice = baseMoneroPrice / conversionRate
        const convertedPixPrice = (baseMoneroPrice * 2) / conversionRate

        return {
            displayPrice: showMoneroPrice
                ? Math.round(convertedMoneroPrice)
                : Math.round(convertedPixPrice),
            originalPrice: showMoneroPrice
                ? Math.round(convertedPixPrice)
                : null,
            currency,
            discount: showMoneroPrice ? 50 : 0,
            isMonero: showMoneroPrice,
        }
    }

    return (
        <MoneroPricingContext.Provider
            value={{ showMoneroPrice, toggleMoneroPrice, calculatePrice }}
        >
            {children}
        </MoneroPricingContext.Provider>
    )
}

export function useMoneroPricing() {
    const context = useContext(MoneroPricingContext)

    // If context is not available, provide default values (Monero as default)
    if (context === undefined) {
        return {
            showMoneroPrice: true,
            toggleMoneroPrice: () => {},
            calculatePrice: (
                baseMoneroPrice: number,
                locale: Locale = "pt-BR"
            ) => {
                const localesMap = { en, "pt-BR": pt, es, de } as const
                const ns = localesMap[
                    locale as keyof typeof localesMap
                ] as unknown as ChannelManagementNs
                const currency = (ns.moneroToggle as MoneroToggleConfig)
                    .currencySymbol!
                const conversionRate = (ns.moneroToggle as MoneroToggleConfig)
                    .conversionRate!

                const convertedMoneroPrice = baseMoneroPrice / conversionRate
                const convertedPixPrice = (baseMoneroPrice * 2) / conversionRate

                return {
                    displayPrice: Math.round(convertedMoneroPrice),
                    originalPrice: Math.round(convertedPixPrice),
                    currency,
                    discount: 50,
                    isMonero: true,
                }
            },
        }
    }

    return context
}
