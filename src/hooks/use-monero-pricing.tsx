"use client"

import React, { createContext, useContext, useState } from "react"

interface MoneroPricingContextType {
    showMoneroPrice: boolean
    toggleMoneroPrice: () => void
    calculatePrice: (baseMoneroPrice: number) => {
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

    const calculatePrice = (baseMoneroPrice: number) => {
        return {
            displayPrice: showMoneroPrice
                ? baseMoneroPrice
                : baseMoneroPrice * 2,
            originalPrice: showMoneroPrice ? baseMoneroPrice * 2 : null,
            currency: "R$",
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
            calculatePrice: (baseMoneroPrice: number) => ({
                displayPrice: baseMoneroPrice,
                originalPrice: baseMoneroPrice * 2,
                currency: "R$",
                discount: 50,
                isMonero: true,
            }),
        }
    }

    return context
}
