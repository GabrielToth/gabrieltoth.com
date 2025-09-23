import { PageProps } from "@/app/[locale]/editors/editors-types"
import Footer from "@/components/layout/footer"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { generateMetadata } from "./editors-metadata"
import {
    AboutSection,
    BenefitsSection,
    CTASection,
    HeroSection,
    RequirementsSection,
    ToolsSection,
} from "./editors-view"
// ✅ MIGRATED: Now using translations/ folder with JSON + icon injection
import { useTranslations } from "next-intl"

export { generateMetadata }

export default async function EditorsPage({ params }: PageProps) {
    const { locale } = await params
    const t = useTranslations("editors")

    // Job posting structured data from i18n
    const jobStructuredData = t.raw("structuredData.jobPosting") as Record<
        string,
        unknown
    >

    // FAQs from i18n
    const faqs = t.raw("faqs") as Array<{ question: string; answer: string }>

    // Breadcrumbs
    const breadcrumbs = [
        {
            name: t("services.title"),
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}`,
        },
        {
            name: t("hero.badge"),
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/editors`,
        },
    ]

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={jobStructuredData}
                breadcrumbs={breadcrumbs}
                faqs={faqs}
            />

            <main className="min-h-screen bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4 py-8">
                    <Breadcrumbs
                        items={breadcrumbs.map((item, index) => ({
                            name: item.name,
                            href: item.url.replace(
                                "https://gabrieltoth.com",
                                ""
                            ),
                            current: index === breadcrumbs.length - 1,
                        }))}
                        hideHome={true}
                        className="mb-6"
                    />
                </div>
                <HeroSection locale={locale} />
                <AboutSection />
                <ToolsSection />
                <RequirementsSection />
                <BenefitsSection />
                <CTASection locale={locale} />
                <Footer locale={locale} />
            </main>
        </>
    )
}

export const revalidate = 3600
