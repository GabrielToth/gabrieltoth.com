"use client"

import { Card } from "@/components/ui/card"
import { DynamicIcon } from "@/components/ui/dynamic-icon"
import { IconName } from "@/lib/icons"

interface BenefitCardProps {
    title: string
    description: string
    iconName: IconName
}

export const BenefitCard = ({
    title,
    description,
    iconName,
}: BenefitCardProps) => {
    return (
        <Card className="p-6 text-center backdrop-blur-sm bg-white/50 dark:bg-gray-900/50">
            <DynamicIcon
                name={iconName}
                size={48}
                className="mx-auto mb-4 text-blue-600"
            />
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </Card>
    )
}
