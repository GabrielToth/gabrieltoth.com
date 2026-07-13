"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface AudienceSectionProps {
    madeForKids: boolean
    onMadeForKidsChange: (value: boolean) => void
}

export default function AudienceSection({
    madeForKids,
    onMadeForKidsChange,
}: AudienceSectionProps) {
    const t = useTranslations("publish")

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{t("step4.audience")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <Label>{t("step4.madeForKids")}</Label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="madeForKids"
                                checked={!madeForKids}
                                onChange={() => onMadeForKidsChange(false)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {t("step4.madeForKidsNo")}
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="madeForKids"
                                checked={madeForKids}
                                onChange={() => onMadeForKidsChange(true)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {t("step4.madeForKidsYes")}
                            </span>
                        </label>
                    </div>
                    <p className="text-xs text-gray-400">
                        {t("step4.madeForKidsHint")}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
