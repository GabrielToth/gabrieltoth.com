import { locales } from "@/lib/i18n"
import { generateMetadata as generatePcOptMetadata } from "../pc-optimization/pc-optimization-metadata"

export const revalidate = 3600

export { default } from "../pc-optimization/page"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any) {
    return generatePcOptMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
