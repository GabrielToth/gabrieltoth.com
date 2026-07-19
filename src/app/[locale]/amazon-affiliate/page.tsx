"use client"

import PageHeader from "@/components/layout/page-header"
import { useLocale } from "@/hooks/use-locale"
import { generateAmazonAffiliateLink } from "@/lib/amazon"
import { useTranslations } from "next-intl"
import { useState } from "react"

export default function AmazonAffiliatePage() {
    const { locale: _locale } = useLocale()
    const t = useTranslations("amazonAffiliate")
    const [inputUrl, setInputUrl] = useState("")
    const [affiliateUrl, setAffiliateUrl] = useState("")
    const [error, setError] = useState<string | null>(null)

    const tag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG || ""

    const onGenerate = () => {
        setError(null)
        try {
            /* c8 ignore start */
            if (!tag) {
                setError(
                    "Missing affiliate tag. Set NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG"
                )
                return
            }
            /* c8 ignore stop */
            const out = generateAmazonAffiliateLink({ url: inputUrl, tag })
            setAffiliateUrl(out)
        } catch (e: unknown) {
            /* c8 ignore next */
            setError((e as Error)?.message || "Invalid URL")
        }
    }

    return (
        <main className="min-h-screen bg-card dark:bg-background">
            <PageHeader
                eyebrow={t("hero.badge")}
                title={t("hero.title")}
                subtitle={t("hero.subtitle")}
            />
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="space-y-3">
                    <input
                        type="url"
                        value={inputUrl}
                        onChange={e => setInputUrl(e.target.value)}
                        placeholder="https://www.amazon.com/dp/..."
                        className="w-full border border-input dark:border-border rounded-md p-2 bg-card text-foreground dark:text-foreground"
                    />
                    <button
                        onClick={onGenerate}
                        className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary"
                    >
                        Generate
                    </button>
                    {error && (
                        <div className="text-sm text-red-600" role="alert">
                            {error}
                        </div>
                    )}
                    {affiliateUrl && (
                        <div className="mt-4 p-3 rounded-md border border-border dark:border-border">
                            <div className="text-sm text-foreground dark:text-foreground break-all">
                                {affiliateUrl}
                            </div>
                            <a
                                href={affiliateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-primary hover:underline"
                            >
                                Open link ↗
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
