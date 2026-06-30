import { locales } from "@/lib/i18n"
import { generateMetadata as generateEditorsMetadata } from "../editors/page"

export const revalidate = 3600

export { default } from "../editors/page"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any) {
    return generateEditorsMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
