import { locales } from "@/lib/i18n"
import { LocalePageProps } from "../lib/locale-page-props"
import { generateMetadata as generatePcOptMetadata } from "../pc-optimization/pc-optimization-metadata"

export const revalidate = 3600

export { default } from "../pc-optimization/page"

export async function generateMetadata(props: LocalePageProps) {
    return generatePcOptMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
