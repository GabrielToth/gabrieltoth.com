import { locales } from "@/lib/i18n"
import { generateMetadata as generatePersonalityMetadata } from "../personality-test/page"

export { default } from "../personality-test/page"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any) {
    return generatePersonalityMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
