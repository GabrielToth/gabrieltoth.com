import EditorsLanding from "@/app/[locale]/editors/editors-landing"
import { type Locale } from "@/lib/i18n"
import { generateMetadata } from "./editors-metadata"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata }

export default async function EditorsPage({ params }: PageProps) {
    const { locale } = await params

    return <EditorsLanding locale={locale} />
}
