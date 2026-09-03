"use client"

import { type Locale } from "@/lib/i18n"
import { getLocalizedPath } from "@/lib/url-mapping"
import { useTranslations } from "next-intl"
import Link from "next/link"

interface ServicesSubmenuProps {
    locale: Locale
}

export default function ServicesSubmenu({ locale }: ServicesSubmenuProps) {
    const t = useTranslations("services")

    const categories = [
        {
            key: "channel-management",
            label: t("landing.channelManagementTitle"),
            description: t("landing.channelManagementDescription"),
        },
        {
            key: "pc-optimization",
            label: t("landing.pcOptimizationTitle"),
            description: t("landing.pcOptimizationDescription"),
        },
        {
            key: "amazon-affiliate",
            label: t("landing.affiliateTitle"),
            description: t("landing.affiliateDescription"),
        },
    ]

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {categories.map(category => (
                <Link
                    key={category.key}
                    href={getLocalizedPath(category.key, locale)}
                    className="group bg-card border border-border/60 rounded-xl p-6 hover:border-primary transition-all duration-200 hover:shadow-lg hover:shadow-primary/10"
                >
                    <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                        {category.label}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                        {category.description}
                    </p>
                </Link>
            ))}
        </div>
    )
}
