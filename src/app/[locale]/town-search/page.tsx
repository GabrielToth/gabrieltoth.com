import { getTranslations } from "next-intl/server"

import { TownSearch } from "@/components/location/town-search"

export default async function TownSearchPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "townSearch" })

    return (
        <main className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
            <TownSearch
                labels={{
                    placeholder: t("placeholder"),
                    searching: t("searching"),
                    noResults: t("noResults"),
                    error: t("error"),
                    selected: t("selected"),
                }}
            />
        </main>
    )
}
