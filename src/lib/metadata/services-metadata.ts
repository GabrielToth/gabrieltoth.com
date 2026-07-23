import { type Locale } from "@/lib/i18n"
import { type Metadata } from "next"

export async function generateServicesMetadata(
    locale: Locale,
    t: (key: string) => string
): Promise<Metadata> {
    return {
        title: `${t("landing.title")} - Gabriel Toth`,
        description: t("landing.description"),
        keywords: [
            "services",
            "channel management",
            "pc optimization",
            "amazon affiliate",

            "consulting",
        ],
        openGraph: {
            title: t("landing.title"),
            description: t("landing.description"),
            type: "website",
            locale: locale,
        },
    }
}
