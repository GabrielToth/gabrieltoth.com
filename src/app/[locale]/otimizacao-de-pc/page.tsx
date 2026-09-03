import { locales } from "@/lib/i18n"
import { LocalePageProps } from "../lib/locale-page-props"
import { generateMetadata as generatePCOptMetadata } from "../pc-optimization/page"

export const revalidate = 3600

export { default } from "../pc-optimization/page"

export async function generateMetadata(props: LocalePageProps) {
    return generatePCOptMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
