import { locales } from "@/lib/i18n"
import { generateMetadata as generatePCOptMetadata } from "../pc-optimization/page"

export const revalidate = 3600

export { default } from "../pc-optimization/page"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any) {
    return generatePCOptMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
