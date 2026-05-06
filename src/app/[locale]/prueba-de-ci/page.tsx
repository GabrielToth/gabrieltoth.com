import { locales } from "@/lib/i18n"
import { generateMetadata as generateIQMetadata } from "../iq-test/page"

export { default } from "../iq-test/page"

export async function generateMetadata(props: any) {
    return generateIQMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
