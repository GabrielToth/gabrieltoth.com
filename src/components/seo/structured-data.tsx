"use client"

import { type Locale } from "@/lib/i18n"
import {
    generatePersonStructuredData,
    generateWebsiteStructuredData,
} from "@/lib/seo"

type StructuredDataType =
    | Record<string, unknown>
    | ReturnType<typeof generatePersonStructuredData>
    | ReturnType<typeof generateWebsiteStructuredData>

interface StructuredDataProps {
    locale: Locale
    type?: "person" | "website" | "both"
    customData?: Record<string, unknown>
}

const StructuredData = ({
    locale,
    type = "both",
    customData,
}: StructuredDataProps) => {
    const structuredDataArray: StructuredDataType[] = []

    if (type === "person" || type === "both") {
        structuredDataArray.push(generatePersonStructuredData(locale))
    }

    if (type === "website" || type === "both") {
        structuredDataArray.push(generateWebsiteStructuredData(locale))
    }

    if (customData) {
        structuredDataArray.push(customData)
    }

    return (
        <>
            {structuredDataArray.map((data, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(data),
                    }}
                />
            ))}
        </>
    )
}

export default StructuredData
