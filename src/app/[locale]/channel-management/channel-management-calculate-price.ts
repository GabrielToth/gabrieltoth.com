import { useMoneroPricing } from "@/hooks/use-monero-pricing"

interface PriceCalculation {
    current: number
    original: number | null
    currency: string
    displayPrice: string
    originalPrice: string | undefined
    isMonero: boolean
}

export const useCalculatePrice = (locale: "en" | "pt-BR") => {
    const { calculatePrice: calculateMoneroPrice } = useMoneroPricing()

    const calculatePrice = (basePrice: number): PriceCalculation => {
        const moneroCalc = calculateMoneroPrice(basePrice, locale)
        return {
            current: moneroCalc.displayPrice,
            original: moneroCalc.originalPrice,
            currency: moneroCalc.currency,
            displayPrice: moneroCalc.displayPrice.toString(),
            originalPrice: moneroCalc.originalPrice?.toString(),
            isMonero: moneroCalc.isMonero,
        }
    }

    return { calculatePrice }
}
