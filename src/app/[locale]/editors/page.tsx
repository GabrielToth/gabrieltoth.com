import { Metadata } from "next"
import { getEditorsTranslations } from "./editors-translations"
import {
    AboutSection,
    BenefitsSection,
    CTASection,
    HeroSection,
    RequirementsSection,
    ToolsSection,
} from "./editors-view"

export const metadata: Metadata = {
    title: "Join Our Video Editing Team | Gabriel Toth",
    description:
        "Join our global team of professional video editors. Work on interesting projects with flexible hours and competitive pay.",
}

export default async function EditorsPage({
    params,
}: {
    params: { locale: "en" | "pt-BR" }
}) {
    const locale = params.locale
    const t = await getEditorsTranslations(locale)

    return (
        <main className="flex min-h-screen flex-col items-center justify-between">
            <HeroSection t={t} />
            <AboutSection t={t} />
            <ToolsSection t={t} />
            <RequirementsSection t={t} />
            <BenefitsSection t={t} />
            <CTASection t={t} />
        </main>
    )
}
