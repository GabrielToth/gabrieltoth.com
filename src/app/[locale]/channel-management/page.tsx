import Footer from "@/components/layout/footer"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import { generateMetadata } from "./channel-management-metadata"
import { buildChannelManagementStructured } from "./channel-management-structured"
import ChannelManagementView from "./channel-management-view"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata }

export default async function ChannelManagementPage({ params }: PageProps) {
    const { locale } = await params
    const { serviceStructuredData, faqs, breadcrumbs, offerCatalog } =
        await buildChannelManagementStructured(locale)

    // breadcrumbs moved to structured helper

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={[serviceStructuredData, offerCatalog]}
                breadcrumbs={breadcrumbs}
                faqs={faqs}
            />

            <main className="min-h-screen bg-white dark:bg-gray-900 relative">
                <ChannelManagementView locale={locale} />

                {/* Breadcrumbs overlay */}
                <div className="absolute top-0 left-0 z-40 pointer-events-none">
                    <div className="container mx-auto px-4 py-8">
                        <div className="pointer-events-auto">
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
                    </div>
                </div>

                <Footer locale={locale} />
            </main>
        </>
    )
}

export const revalidate = 3600
