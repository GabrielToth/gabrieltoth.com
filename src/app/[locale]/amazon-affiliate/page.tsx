"use client"

import { useLocale } from "@/hooks/use-locale"
import { generateAmazonAffiliateLink } from "@/lib/amazon"
import { useState } from "react"

export default function AmazonAffiliatePage() {
    const { locale: _locale } = useLocale()
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
        <main className="min-h-screen bg-white dark:bg-gray-900 pt-24 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Amazon Affiliate Link Generator
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Paste an Amazon product or search URL below and generate
                    your affiliate link.
                </p>
                <div className="space-y-3">
                    <input
                        type="url"
                        value={inputUrl}
                        onChange={e => setInputUrl(e.target.value)}
                        placeholder="https://www.amazon.com/dp/..."
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <button
                        onClick={onGenerate}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Generate
                    </button>
                    {error && (
                        <div className="text-sm text-red-600" role="alert">
                            {error}
                        </div>
                    )}
                    {affiliateUrl && (
                        <div className="mt-4 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-gray-700 dark:text-gray-300 break-all">
                                {affiliateUrl}
                            </div>
                            <a
                                href={affiliateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-blue-600 hover:underline"
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
