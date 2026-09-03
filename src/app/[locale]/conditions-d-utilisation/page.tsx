import { locales } from "@/lib/i18n"
import { LocalePageProps } from "../lib/locale-page-props"
import { generateMetadata as generateTermsMetadata } from "../terms-of-service/terms-of-service-metadata"

export const revalidate = 3600

export { default } from "../terms-of-service/page"

export async function generateMetadata(props: LocalePageProps) {
    return generateTermsMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
