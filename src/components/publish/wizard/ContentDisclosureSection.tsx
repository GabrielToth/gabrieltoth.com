"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface ContentDisclosureSectionProps {
    aiGenerated: boolean
    onAiGeneratedChange: (value: boolean) => void
    paidPromotion: boolean
    onPaidPromotionChange: (value: boolean) => void
}

export default function ContentDisclosureSection({
    aiGenerated,
    onAiGeneratedChange,
    paidPromotion,
    onPaidPromotionChange,
}: ContentDisclosureSectionProps) {
    const t = useTranslations("publish")

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{t("step4.content")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* AI Generated */}
                <div className="space-y-3">
                    <Label>{t("step4.aiGenerated")}</Label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="aiGenerated"
                                checked={!aiGenerated}
                                onChange={() => onAiGeneratedChange(false)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {t("step4.aiGeneratedNo")}
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="aiGenerated"
                                checked={aiGenerated}
                                onChange={() => onAiGeneratedChange(true)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {t("step4.aiGeneratedYes")}
                            </span>
                        </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t("step4.aiGeneratedHint")}
                    </p>
                </div>

                {/* Paid Promotion */}
                <div className="space-y-3">
                    <Label>{t("step4.paidPromotion")}</Label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="paidPromotion"
                                checked={!paidPromotion}
                                onChange={() => onPaidPromotionChange(false)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {t("step4.paidPromotionNo")}
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="paidPromotion"
                                checked={paidPromotion}
                                onChange={() => onPaidPromotionChange(true)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {t("step4.paidPromotionYes")}
                            </span>
                        </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t("step4.paidPromotionHint")}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
