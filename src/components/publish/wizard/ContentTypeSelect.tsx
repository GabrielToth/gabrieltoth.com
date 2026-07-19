"use client"

import { useTranslations } from "next-intl"
import { FileVideo, Newspaper } from "lucide-react"
import type { ContentType } from "./types"

interface ContentTypeSelectProps {
    selectedType: ContentType
    onSelect: (type: ContentType) => void
    onNext: () => void
}

const CONTENT_TYPES: {
    id: ContentType
    labelKey: string
    descKey: string
    icon: React.ReactNode
}[] = [
    {
        id: "post",
        labelKey: "contentType.post.label",
        descKey: "contentType.post.description",
        icon: <Newspaper className="h-8 w-8" />,
    },
    {
        id: "video",
        labelKey: "contentType.video.label",
        descKey: "contentType.video.description",
        icon: <FileVideo className="h-8 w-8" />,
    },
]

export default function ContentTypeSelect({
    selectedType,
    onSelect,
    onNext,
}: ContentTypeSelectProps) {
    const t = useTranslations("publish")

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">
                    {t("contentType.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                    {t("contentType.description")}
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {CONTENT_TYPES.map(ct => {
                    const isSelected = selectedType === ct.id
                    return (
                        <button
                            key={ct.id}
                            type="button"
                            onClick={() => onSelect(ct.id)}
                            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all ${
                                isSelected
                                    ? "border-primary bg-primary/5 ring-2 ring-blue-200 dark:border-primary dark:bg-primary/10/20"
                                    : "border-border bg-white hover:border-input dark:border-border dark:bg-background dark:hover:border-input"
                            }`}
                        >
                            <div
                                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                                    isSelected
                                        ? "bg-primary/10 text-primary dark:bg-primary/10/50 dark:text-primary"
                                        : "bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground"
                                }`}
                            >
                                {ct.icon}
                            </div>
                            <div>
                                <p
                                    className={`text-lg font-semibold ${
                                        isSelected
                                            ? "text-primary dark:text-primary"
                                            : "text-foreground dark:text-foreground"
                                    }`}
                                >
                                    {t(ct.labelKey)}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                                    {t(ct.descKey)}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="flex justify-end border-t pt-4 dark:border-border">
                <button
                    type="button"
                    onClick={onNext}
                    className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary disabled:opacity-50"
                >
                    {t("wizard.next")}
                </button>
            </div>
        </div>
    )
}
