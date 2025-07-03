import PCOptimizationLanding from "@/app/[locale]/pc-optimization/pc-optimization-landing"
import { type Locale } from "@/lib/i18n"
import { generateMetadata } from "./pc-optimization-metadata"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata }

export default async function PCOptimizationPage({ params }: PageProps) {
    const { locale } = await params

    return <PCOptimizationLanding locale={locale} />
}
