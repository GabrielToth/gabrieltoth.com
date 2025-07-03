"use client"

import { useMoneroPricing } from "@/hooks/use-monero-pricing"
import { DollarSign } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

interface PricingToggleProps {
    locale: "en" | "pt-BR"
}

// Client-only component that uses the hook
function PricingToggleClient({ locale }: PricingToggleProps) {
    const { showMoneroPrice, toggleMoneroPrice } = useMoneroPricing()
    const isPortuguese = locale === "pt-BR"

    return (
        <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
                <button
                    onClick={toggleMoneroPrice}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        showMoneroPrice
                            ? "bg-orange-500 text-white shadow-md"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                >
                    <span className="text-orange-400">₽</span>
                    Monero
                    {showMoneroPrice && (
                        <span className="bg-orange-600 text-xs px-2 py-1 rounded-full">
                            50% OFF
                        </span>
                    )}
                </button>
                <button
                    onClick={toggleMoneroPrice}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                        !showMoneroPrice
                            ? "bg-blue-500 text-white shadow-md"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                >
                    <DollarSign className="w-4 h-4" />
                    {isPortuguese ? "PIX/Cartão" : "Card"}
                </button>
            </div>
        </div>
    )
}

// Fallback component for SSR
function PricingToggleFallback({ locale }: PricingToggleProps) {
    const isPortuguese = locale === "pt-BR"

    return (
        <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
                <div className="px-4 py-2 rounded-md text-sm font-medium bg-orange-500 text-white shadow-md flex items-center gap-2">
                    <span className="text-orange-100">₽</span>
                    Monero
                    <span className="bg-orange-600 text-xs px-2 py-1 rounded-full">
                        50% OFF
                    </span>
                </div>
                <div className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {isPortuguese ? "PIX/Cartão" : "Card"}
                </div>
            </div>
        </div>
    )
}

// Dynamic import with no SSR
const DynamicPricingToggle = dynamic(
    () => Promise.resolve(PricingToggleClient),
    {
        ssr: false,
        loading: () => <PricingToggleFallback locale="pt-BR" />,
    }
)

export default function PricingToggle({ locale }: PricingToggleProps) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return <PricingToggleFallback locale={locale} />
    }

    return <DynamicPricingToggle locale={locale} />
}
