import WaveIGLSupportLanding from "@/app/[locale]/waveigl-support/waveigl-support-landing"
import { type Locale } from "@/lib/i18n"
import { generateMetadata } from "./waveigl-support-metadata"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata }

export default async function WaveIGLSupportPage({ params }: PageProps) {
    const { locale } = await params

    return <WaveIGLSupportLanding locale={locale} />
}
