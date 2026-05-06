import { locales } from "@/lib/i18n"
import { generateMetadata as generatePrivacyMetadata } from "../privacy-policy/page"

export const revalidate = 3600

export { default } from "../privacy-policy/page"

export async function generateMetadata(props: any) {
    return generatePrivacyMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
