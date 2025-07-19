"use client"

import { type Locale } from "@/lib/i18n"
import React, { createContext, useContext, useState } from "react"

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
        // Currency and conversion logic by locale
        const getCurrencyInfo = (locale: Locale) => {
            switch (locale) {
                case "en":
                    return { conversionRate: 6, currency: "$" }
                case "es":
                case "de":
                    return { conversionRate: 5.5, currency: "€" } // EUR conversion
                case "pt-BR":
                default:
                    return { conversionRate: 1, currency: "R$" } // BRL base
            }
        }

        const { conversionRate, currency } = getCurrencyInfo(locale)

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
                const isEnglish = locale === "en"
                const conversionRate = isEnglish ? 6 : 1
                const currency = isEnglish ? "$" : "R$"

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
