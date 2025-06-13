"use client"

import { useMoneroPricing } from "@/hooks/use-monero-pricing"
import { DollarSign, Percent } from "lucide-react"

interface PricingToggleProps {
    locale: "en" | "pt-BR"
}

export default function PricingToggle({ locale }: PricingToggleProps) {
    const { showMoneroPrice, toggleMoneroPrice } = useMoneroPricing()
    const isPortuguese = locale === "pt-BR"

    return (
        <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
                <button
                    onClick={() => !showMoneroPrice && toggleMoneroPrice()}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        showMoneroPrice
                            ? "bg-orange-500 text-white shadow-md"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                >
                    <Percent className="w-4 h-4" />
                    {isPortuguese ? "Com Monero" : "With Monero"}
                    <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        50% OFF
                    </span>
                </button>
                <button
                    onClick={() => showMoneroPrice && toggleMoneroPrice()}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        !showMoneroPrice
                            ? "bg-blue-500 text-white shadow-md"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                >
                    <DollarSign className="w-4 h-4" />
                    {isPortuguese ? "PIX/Cartão" : "PIX/Card"}
                </button>
            </div>
        </div>
    )
}
