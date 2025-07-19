"use client"

import { type Locale } from "@/lib/i18n"
import {
    generateBreadcrumbStructuredData,
    generateFAQStructuredData,
    generateOrganizationStructuredData,
    generatePersonStructuredData,
    generateWebsiteStructuredData,
} from "@/lib/seo"

type StructuredDataType =
    | Record<string, unknown>
    | ReturnType<typeof generatePersonStructuredData>
    | ReturnType<typeof generateWebsiteStructuredData>
    | ReturnType<typeof generateOrganizationStructuredData>
    | ReturnType<typeof generateBreadcrumbStructuredData>
    | ReturnType<typeof generateFAQStructuredData>

interface BreadcrumbItem {
    name: string
    url: string
}

interface FAQItem {
    question: string
    answer: string
}

interface StructuredDataProps {
    locale: Locale
    type?:
        | "person"
        | "website"
        | "organization"
        | "breadcrumb"
        | "faq"
        | "both"
        | "all"
    customData?: Record<string, unknown>
    breadcrumbs?: BreadcrumbItem[]
    faqs?: FAQItem[]
}

const StructuredData = ({
    locale,
    type = "both",
    customData,
    breadcrumbs = [],
    faqs = [],
}: StructuredDataProps) => {
    const structuredDataArray: StructuredDataType[] = []

    // Add standard schemas
    if (type === "person" || type === "both" || type === "all") {
        structuredDataArray.push(generatePersonStructuredData(locale))
    }

    if (type === "website" || type === "both" || type === "all") {
        structuredDataArray.push(generateWebsiteStructuredData(locale))
    }

    if (type === "organization" || type === "all") {
        structuredDataArray.push(generateOrganizationStructuredData(locale))
    }

    // Add breadcrumbs if provided
    if ((type === "breadcrumb" || type === "all") && breadcrumbs.length > 0) {
        structuredDataArray.push(generateBreadcrumbStructuredData(breadcrumbs))
    }

    // Add FAQs if provided
    if ((type === "faq" || type === "all") && faqs.length > 0) {
        structuredDataArray.push(generateFAQStructuredData(locale, faqs))
    }

    // Add custom data
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
