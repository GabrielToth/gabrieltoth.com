import { locales } from "@/lib/i18n"

export { default } from "../amazon-affiliate/page"

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
