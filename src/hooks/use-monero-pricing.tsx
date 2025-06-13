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
    const [showMoneroPrice, setShowMoneroPrice] = useState(false)

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
    if (context === undefined) {
        throw new Error(
            "useMoneroPricing must be used within a MoneroPricingProvider"
        )
    }
    return context
}
