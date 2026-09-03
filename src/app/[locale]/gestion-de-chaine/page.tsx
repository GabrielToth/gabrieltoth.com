import { locales } from "@/lib/i18n"
import { LocalePageProps } from "../lib/locale-page-props"
import { generateMetadata as generateCMPageMetadata } from "../channel-management/page"

export const revalidate = 3600

export { default } from "../channel-management/page"

export async function generateMetadata(props: LocalePageProps) {
    return generateCMPageMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
