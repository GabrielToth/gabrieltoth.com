import { locales } from "@/lib/i18n"
import { generateMetadata as generateAboutMetadata } from "../about-me/page"

export const revalidate = 3600

export { default } from "../about-me/page"

export async function generateMetadata(props: any) {
    return generateAboutMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
