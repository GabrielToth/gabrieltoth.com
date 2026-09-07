import { locales } from "@/lib/i18n"

export { default } from "../services/page"

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
