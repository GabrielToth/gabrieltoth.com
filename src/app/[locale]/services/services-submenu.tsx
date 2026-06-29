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
        {
            key: "iq-test",
            label: t("landing.iqTestTitle"),
            description: t("landing.iqTestDescription"),
        },
        {
            key: "personality-test",
            label: t("landing.personalityTestTitle"),
            description: t("landing.personalityTestDescription"),
        },
    ]

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {categories.map(category => (
                <Link
                    key={category.key}
                    href={getLocalizedPath(category.key as any, locale)}
                    className="group bg-[#2d2d2d] border border-neutral-700 rounded-lg p-6 hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                >
                    <h3 className="text-lg font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
                        {category.label}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2">
                        {category.description}
                    </p>
                </Link>
            ))}
        </div>
    )
}
