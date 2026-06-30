import { locales } from "@/lib/i18n"
import { generateMetadata as generateChannelMetadata } from "../channel-management/page"

export const revalidate = 3600

export { default } from "../channel-management/page"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any) {
    return generateChannelMetadata(props)
}

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
