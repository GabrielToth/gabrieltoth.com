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

import { buildEditorsStructured } from "./editors-structured"

export { generateMetadata }

export default async function EditorsPage({ params }: PageProps) {
    const { locale } = await params
    const { jobStructuredData, faqs, breadcrumbs } =
        await buildEditorsStructured(locale)

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
                            href: item.url,
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
