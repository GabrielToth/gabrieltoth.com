import { locales } from "@/lib/i18n"

export { default } from "../login/page"

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
