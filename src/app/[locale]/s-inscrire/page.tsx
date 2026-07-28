import { locales } from "@/lib/i18n"

export const revalidate = 3600

export { default } from "../register/page"

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}
