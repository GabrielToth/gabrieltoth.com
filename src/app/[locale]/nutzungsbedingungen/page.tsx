import { locales } from "@/lib/i18n"
import { generateMetadata as generateTermsMetadata } from "../terms-of-service/page"

export const revalidate = 3600

export { default } from "../terms-of-service/page"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any) {
    return generateTermsMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
