"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CardsEndScreensSectionProps {
    linkedVideoStart: string
    onLinkedVideoStartChange: (value: string) => void
    linkedVideoEnd: string
    onLinkedVideoEndChange: (value: string) => void
}

export default function CardsEndScreensSection({
    linkedVideoStart,
    onLinkedVideoStartChange,
    linkedVideoEnd,
    onLinkedVideoEndChange,
}: CardsEndScreensSectionProps) {
    const t = useTranslations("publish")

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{t("step4.cards")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-xs text-gray-400">{t("step4.cardsHint")}</p>
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="video-link-start">
                            {t("step4.addVideoStart")}
                        </Label>
                        <Input
                            id="video-link-start"
                            value={linkedVideoStart}
                            onChange={e =>
                                onLinkedVideoStartChange(e.target.value)
                            }
                            placeholder={t("step4.videoUrlPlaceholder")}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="video-link-end">
                            {t("step4.addVideoEnd")}
                        </Label>
                        <Input
                            id="video-link-end"
                            value={linkedVideoEnd}
                            onChange={e =>
                                onLinkedVideoEndChange(e.target.value)
                            }
                            placeholder={t("step4.videoUrlPlaceholder")}
                            className="mt-1"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
