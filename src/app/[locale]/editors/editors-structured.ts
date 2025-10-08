import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

import { getEditorsBreadcrumbs } from "./editors-breadcrumbs"

export async function buildEditorsStructured(locale: Locale): Promise<{
    jobStructuredData: Record<string, unknown>
    faqs: Array<{ question: string; answer: string }>
    breadcrumbs: Array<{ name: string; url: string }>
}> {
    const t = await getTranslations({ locale, namespace: "editors" })

    /* c8 ignore next */
    const jobStructuredData = t.raw("structuredData.jobPosting") as Record<
        string,
        unknown
    >

    /* c8 ignore next */
    const faqs = t.raw("faqs") as Array<{ question: string; answer: string }>

    const breadcrumbs = getEditorsBreadcrumbs(locale)

    return { jobStructuredData, faqs, breadcrumbs }
}
