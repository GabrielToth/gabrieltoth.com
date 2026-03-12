import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import { locales, type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import LandingBenefitsSection from "./home/landing-benefits-section"
import LandingCtaSection from "./home/landing-cta-section"
import LandingFaqSection from "./home/landing-faq-section"
import LandingFeaturesSection from "./home/landing-features-section"
import LandingHeroSection from "./home/landing-hero-section"
import LandingPlatformsSection from "./home/landing-platforms-section"
import LandingPricingSection from "./home/landing-pricing-section"

interface HomePageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: HomePageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "landing" })

    return {
        title: t("hero.title"),
        description: t("hero.subtitle"),
    }
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}

export default async function HomePage({ params }: HomePageProps) {
    const { locale } = await params

    return (
        <>
            <main className="min-h-screen bg-white dark:bg-gray-900">
                <Header />
                <LandingHeroSection locale={locale} />
                <LandingFeaturesSection />
                <LandingPlatformsSection />
                <LandingBenefitsSection />
                <LandingPricingSection locale={locale} />
                <LandingFaqSection />
                <LandingCtaSection locale={locale} />
                <Footer locale={locale} />
            </main>
        </>
    )
}

export const revalidate = 3600
