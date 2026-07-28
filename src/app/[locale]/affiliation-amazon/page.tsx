import { locales } from "@/lib/i18n"

export const revalidate = 3600

export { default } from "../amazon-affiliate/page"

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
