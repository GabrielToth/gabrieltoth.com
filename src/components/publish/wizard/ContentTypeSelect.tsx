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
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:border-blue-400 dark:bg-blue-950/20"
                                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                            }`}
                        >
                            <div
                                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                                    isSelected
                                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                            >
                                {ct.icon}
                            </div>
                            <div>
                                <p
                                    className={`text-lg font-semibold ${
                                        isSelected
                                            ? "text-blue-700 dark:text-blue-300"
                                            : "text-gray-900 dark:text-white"
                                    }`}
                                >
                                    {t(ct.labelKey)}
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {t(ct.descKey)}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="flex justify-end border-t pt-4 dark:border-gray-700">
                <button
                    type="button"
                    onClick={onNext}
                    className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {t("wizard.next")}
                </button>
            </div>
        </div>
    )
}
