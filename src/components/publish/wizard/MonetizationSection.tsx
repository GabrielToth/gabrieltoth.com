"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface MonetizationSectionProps {
    monetizationEnabled: boolean
    onMonetizationChange: (value: boolean) => void
}

export default function MonetizationSection({
    monetizationEnabled,
    onMonetizationChange,
}: MonetizationSectionProps) {
    const t = useTranslations("publish")

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    {t("step4.monetization")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <Label>{t("step4.monetizationTitle")}</Label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="monetization"
                                checked={monetizationEnabled}
                                onChange={() => onMonetizationChange(true)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {t("step4.monetizationYes")}
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="monetization"
                                checked={!monetizationEnabled}
                                onChange={() => onMonetizationChange(false)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {t("step4.monetizationNo")}
                            </span>
                        </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t("step4.monetizationHint")}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
