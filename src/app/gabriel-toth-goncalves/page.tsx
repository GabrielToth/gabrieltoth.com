import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
import { defaultLocale, type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import AboutSection from "../[locale]/home/about-section"
import ChannelManagementSection from "../[locale]/home/channel-management-section"
import ContactSection from "../[locale]/home/contact-section"
import ProjectsSection from "../[locale]/home/projects-section"

interface AboutPageProps {
    params: Promise<Record<string, unknown>>
}

export async function generateMetadata(): Promise<Metadata> {
    // Use default locale for metadata generation
    const locale = defaultLocale as Locale

    const seoConfig = generateSeoConfig({
        locale,
        path: "/gabriel-toth-goncalves",
        title: undefined,
        description: undefined,
        keywords: [],
        ogType: "website",
        ogImage: "https://www.gabrieltoth.com/og-image-home.jpg",
    })

    return {
        title: seoConfig.title,
        description: seoConfig.description,
        keywords: seoConfig.additionalMetaTags?.find(
            tag => tag.name === "keywords"
        )?.content,
        robots: seoConfig.additionalMetaTags?.find(tag => tag.name === "robots")
            ?.content,
        openGraph: {
            title: seoConfig.openGraph?.title,
            description: seoConfig.openGraph?.description,
            url: seoConfig.canonical,
            type: seoConfig.openGraph?.type as "website",
            locale: seoConfig.openGraph?.locale,
            images: seoConfig.openGraph?.images?.map(img => ({
                url: img.url!,
                width: img.width,
                height: img.height,
                alt: img.alt!,
                type: img.type,
            })),
            siteName: "Gabriel Toth Portfolio",
        },
        twitter: {
            card: seoConfig.twitter?.card as "summary_large_image",
            title: seoConfig.twitter?.title,
            description: seoConfig.twitter?.description,
            images: seoConfig.twitter?.images,
            creator: seoConfig.twitter?.creator,
            site: seoConfig.twitter?.site,
        },
        alternates: {
            canonical: seoConfig.canonical,
            languages: {
                en: "https://www.gabrieltoth.com/gabriel-toth-goncalves",
                "pt-BR": "https://www.gabrieltoth.com/gabriel-toth-goncalves",
                es: "https://www.gabrieltoth.com/gabriel-toth-goncalves",
                de: "https://www.gabrieltoth.com/gabriel-toth-goncalves",
                "x-default":
                    "https://www.gabrieltoth.com/gabriel-toth-goncalves",
            },
        },
    }
}

export default async function AboutPage({ params }: AboutPageProps) {
    // Use default locale for this language-independent page
    const locale = defaultLocale as Locale
    const th = await getTranslations({ locale, namespace: "home" })
    const homepageStructuredData = th.raw(
        "structuredData.profilePage"
    ) as Record<string, unknown>

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={homepageStructuredData}
            />

            <main className="min-h-screen bg-white dark:bg-gray-900">
                <Header />
                <AboutSection params={{ locale }} />
                <ProjectsSection />
                <ChannelManagementSection params={{ locale }} />
                <ContactSection />
                <Footer locale={locale} />
            </main>
        </>
    )
}

export const revalidate = 3600
