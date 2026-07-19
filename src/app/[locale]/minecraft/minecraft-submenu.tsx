"use client"

import { type Locale } from "@/lib/i18n"
import { getLocalizedPath } from "@/lib/url-mapping"
import { useTranslations } from "next-intl"
import Link from "next/link"

interface MinecraftSubmenuProps {
    locale: Locale
}

export default function MinecraftSubmenu({ locale }: MinecraftSubmenuProps) {
    const t = useTranslations("minecraft")

    const categories = [
        {
            key: "minecraft-modpacks",
            label: t("landing.modpacksTitle"),
            description: t("landing.modpacksDescription"),
        },
        {
            key: "minecraft-mods",
            label: t("landing.modsTitle"),
            description: t("landing.modsDescription"),
        },
        {
            key: "minecraft-plugins",
            label: t("landing.journey.plugins", { defaultValue: "Plugins" }),
            description: t("landing.journey.pluginsText", {
                defaultValue:
                    "Server plugins and modifications for enhanced multiplayer experiences",
            }),
        },
        {
            key: "minecraft-contributions",
            label: t("landing.journey.contributions", {
                defaultValue: "Contributions",
            }),
            description: t("landing.journey.contributionsText", {
                defaultValue:
                    "My contributions to the Minecraft modding community",
            }),
        },
    ]

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {categories.map(category => (
                <Link
                    key={category.key}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={getLocalizedPath(category.key as any, locale)}
                    className="group bg-[#2d2d2d] border border-neutral-700 rounded-lg p-6 hover:border-[#10b981] transition-all duration-200 hover:shadow-lg hover:shadow-[#10b981]/20"
                >
                    <h3 className="text-lg font-bold mb-2 text-white group-hover:text-[#10b981] transition-colors">
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
