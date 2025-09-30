"use client"

import LanguageSelector from "@/components/ui/language-selector"

interface Props {
    variant?: "default" | "header" | "footer"
    className?: string
    includeThemeToggle?: boolean
}

export default function LanguageSelectorWrapper({
    variant = "default",
    className,
    includeThemeToggle = false,
}: Props) {
    return (
        <LanguageSelector
            variant={variant}
            className={className}
            includeThemeToggle={includeThemeToggle}
        />
    )
}
