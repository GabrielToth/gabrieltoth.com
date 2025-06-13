import { DollarSign } from "lucide-react"

interface PricingToggleProps {
    locale: "en" | "pt-BR"
}

export default function PricingToggle({ locale }: PricingToggleProps) {
    const isPortuguese = locale === "pt-BR"

    return (
        <div className="flex items-center justify-center mb-8">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex">
                <div className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white shadow-md flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {isPortuguese ? "PIX/Cartão" : "PIX/Card"}
                </div>
            </div>
        </div>
    )
}
