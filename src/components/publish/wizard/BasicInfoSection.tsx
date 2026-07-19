"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface BasicInfoSectionProps {
    title: string
    onTitleChange: (title: string) => void
    description: string
    onDescriptionChange: (description: string) => void
    tags: string[]
    onTagsChange: (raw: string) => void
    errors: Record<string, string>
}

export default function BasicInfoSection({
    title,
    onTitleChange,
    description,
    onDescriptionChange,
    tags,
    onTagsChange,
    errors,
}: BasicInfoSectionProps) {
    const t = useTranslations("publish")

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    {t("step4.basicInfo")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="video-title">
                        {t("step4.title")}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="video-title"
                        value={title}
                        onChange={e =>
                            onTitleChange(e.target.value.slice(0, 100))
                        }
                        placeholder={t("step4.titlePlaceholder")}
                        maxLength={100}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                            {title.length}/100 {t("step4.titleMax")}
                        </span>
                        {errors.title && (
                            <span className="text-red-500">{errors.title}</span>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="video-description">
                        {t("step4.description")}
                    </Label>
                    <Textarea
                        id="video-description"
                        value={description}
                        onChange={e =>
                            onDescriptionChange(e.target.value.slice(0, 5000))
                        }
                        placeholder={t("step4.descriptionPlaceholder")}
                        className="min-h-24 resize-none"
                        maxLength={5000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                            {description.length}/5000{" "}
                            {t("step4.descriptionMax")}
                        </span>
                        {errors.description && (
                            <span className="text-red-500">
                                {errors.description}
                            </span>
                        )}
                    </div>
                </div>

                {/* Thumbnail hint */}
                <div className="rounded bg-muted p-3 text-xs text-muted-foreground dark:bg-background">
                    {t("step4.thumbnailHint")}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <Label htmlFor="video-tags">{t("step4.tags")}</Label>
                    <Input
                        id="video-tags"
                        value={tags.join(", ")}
                        onChange={e => onTagsChange(e.target.value)}
                        placeholder={t("step4.tagsPlaceholder")}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t("step4.tagsHint")}</span>
                        <span>{tags.length}/30 tags</span>
                    </div>
                    {errors.tags && (
                        <span className="text-xs text-red-500">
                            {errors.tags}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
