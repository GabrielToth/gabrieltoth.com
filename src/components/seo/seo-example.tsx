"use client"

/**
 * SEO Implementation Examples
 *
 * This file demonstrates how to use the comprehensive SEO system implemented
 * with JSON-LD structured data, OpenGraph/Twitter meta tags, and clean URLs.
 *
 * Author: Gabriel Toth Gonçalves
 *
 * Features:
 * - Next SEO integration
 * - Multiple JSON-LD schema types (Person, Website, Organization, Service, FAQ, Breadcrumb)
 * - Enhanced OpenGraph and Twitter Cards
 * - Automatic breadcrumb generation
 * - Clean URL structure with i18n support
 * - Dynamic sitemap and robots.txt generation
 * - Structured data validation
 */

import {
    useArticleSeo,
    useFAQSeo,
    useSeo,
    useServiceSeo,
} from "@/hooks/use-seo"
import { type Locale } from "@/lib/i18n"
import { NextSeo } from "next-seo"
import Breadcrumbs from "../ui/breadcrumbs"
import StructuredData from "./structured-data"

// Example 1: Basic SEO usage for a standard page
export function BasicSEOExample({ locale }: { locale: Locale }) {
    const { nextSeoConfig, structuredDataProps } = useSeo({
        title: "My Page Title",
        description: "Detailed page description for SEO",
        keywords: ["react", "nextjs", "seo", "web development"],
        path: "/my-page",
    })

    return (
        <>
            <NextSeo {...nextSeoConfig} />
            <StructuredData {...structuredDataProps} />

            <div>
                <Breadcrumbs className="mb-4" />
                <h1>My Page Content</h1>
            </div>
        </>
    )
}

// Example 2: Service page with custom structured data
export function ServicePageExample({ locale }: { locale: Locale }) {
    const serviceData = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Web Development Service",
        description: "Professional web development services",
        provider: {
            "@type": "Person",
            name: "Gabriel Toth Gonçalves",
        },
        offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            priceCurrency: "USD",
        },
    }

    const { nextSeoConfig, structuredDataProps } = useServiceSeo(serviceData, {
        title: "Professional Web Development Services",
        description:
            "Get professional web development services with modern technologies",
        keywords: ["web development", "react", "nextjs", "typescript"],
        ogImage: "https://example.com/service-image.jpg",
    })

    return (
        <>
            <NextSeo {...nextSeoConfig} />
            <StructuredData {...structuredDataProps} />

            <div>
                <Breadcrumbs className="mb-4" />
                <h1>Web Development Services</h1>
            </div>
        </>
    )
}

// Example 3: FAQ page with structured data
export function FAQPageExample({ locale }: { locale: Locale }) {
    const faqs = [
        {
            question: "What services do you offer?",
            answer: "We offer full-stack web development, SEO optimization, and digital consulting services.",
        },
        {
            question: "How long does a project take?",
            answer: "Project timelines vary based on complexity, typically ranging from 2-12 weeks.",
        },
        {
            question: "Do you provide ongoing support?",
            answer: "Yes, we offer maintenance and support packages for all our projects.",
        },
    ]

    const { nextSeoConfig, structuredDataProps } = useFAQSeo(faqs, {
        title: "Frequently Asked Questions - Web Development",
        description:
            "Find answers to common questions about our web development services",
        keywords: ["faq", "web development", "questions", "support"],
    })

    return (
        <>
            <NextSeo {...nextSeoConfig} />
            <StructuredData {...structuredDataProps} />

            <div>
                <Breadcrumbs className="mb-4" />
                <h1>Frequently Asked Questions</h1>

                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b pb-4">
                            <h3 className="font-semibold text-lg mb-2">
                                {faq.question}
                            </h3>
                            <p className="text-gray-600">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

// Example 4: Article/Blog post with rich structured data
export function ArticlePageExample({ locale }: { locale: Locale }) {
    const articleData = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "How to Implement SEO in Next.js",
        author: {
            "@type": "Person",
            name: "Gabriel Toth Gonçalves",
        },
        datePublished: "2024-01-15",
        dateModified: "2024-01-15",
        publisher: {
            "@type": "Organization",
            name: "Gabriel Toth Tech",
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": "https://gabrieltoth.com/blog/nextjs-seo",
        },
    }

    const customBreadcrumbs = [
        { name: "Home", url: "https://gabrieltoth.com" },
        { name: "Blog", url: "https://gabrieltoth.com/blog" },
        { name: "SEO Guide", url: "https://gabrieltoth.com/blog/nextjs-seo" },
    ]

    const { nextSeoConfig, structuredDataProps } = useArticleSeo(articleData, {
        title: "How to Implement SEO in Next.js - Complete Guide",
        description:
            "Learn how to implement comprehensive SEO in Next.js with structured data, meta tags, and best practices",
        keywords: [
            "nextjs",
            "seo",
            "structured data",
            "web development",
            "tutorial",
        ],
        breadcrumbs: customBreadcrumbs,
        ogImage: "https://gabrieltoth.com/blog/nextjs-seo-og.jpg",
        twitterCard: "summary_large_image",
    })

    return (
        <>
            <NextSeo {...nextSeoConfig} />
            <StructuredData {...structuredDataProps} />

            <div>
                <Breadcrumbs
                    items={customBreadcrumbs.map(item => ({
                        name: item.name,
                        href: item.url.replace("https://gabrieltoth.com", ""),
                    }))}
                    className="mb-6"
                />

                <article>
                    <h1>How to Implement SEO in Next.js</h1>
                    <p>Complete guide to implementing SEO...</p>
                </article>
            </div>
        </>
    )
}

// Example 5: Product/E-commerce page
export function ProductPageExample({ locale }: { locale: Locale }) {
    const productData = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Premium Web Development Package",
        description: "Complete web development solution with React and Next.js",
        brand: {
            "@type": "Brand",
            name: "Gabriel Toth Tech",
        },
        offers: {
            "@type": "Offer",
            price: "2999",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            seller: {
                "@type": "Person",
                name: "Gabriel Toth Gonçalves",
            },
        },
        aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            reviewCount: "25",
        },
    }

    const { nextSeoConfig, structuredDataProps } = useSeo({
        title: "Premium Web Development Package - Gabriel Toth",
        description:
            "Get a complete web development solution with modern technologies and expert support",
        keywords: ["web development", "react", "nextjs", "premium", "package"],
        ogType: "product",
        ogImage: "https://gabrieltoth.com/products/premium-package.jpg",
        customStructuredData: productData,
        structuredDataType: "all",
    })

    return (
        <>
            <NextSeo {...nextSeoConfig} />
            <StructuredData {...structuredDataProps} />

            <div>
                <Breadcrumbs className="mb-4" />
                <h1>Premium Web Development Package</h1>
                <p>Complete solution for your web development needs.</p>
            </div>
        </>
    )
}

// Example 6: Manual structured data usage
export function ManualStructuredDataExample({ locale }: { locale: Locale }) {
    const customBreadcrumbs = [
        { name: "Home", url: "https://gabrieltoth.com" },
        { name: "Services", url: "https://gabrieltoth.com/services" },
    ]

    const customFAQs = [
        {
            question: "What is your response time?",
            answer: "We typically respond within 24 hours during business days.",
        },
    ]

    const customData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Gabriel Toth Tech",
        address: {
            "@type": "PostalAddress",
            addressCountry: "BR",
        },
    }

    return (
        <>
            {/* Manual NextSeo configuration */}
            <NextSeo
                title="Custom Page Title"
                description="Custom page description"
                canonical="https://gabrieltoth.com/custom-page"
                openGraph={{
                    title: "Custom OG Title",
                    description: "Custom OG description",
                    images: [
                        {
                            url: "https://gabrieltoth.com/custom-og.jpg",
                            width: 1200,
                            height: 630,
                            alt: "Custom image",
                        },
                    ],
                }}
                twitter={{
                    cardType: "summary_large_image",
                    site: "@gabrieltoth",
                }}
            />

            {/* Manual structured data */}
            <StructuredData
                locale={locale}
                type="all"
                customData={customData}
                breadcrumbs={customBreadcrumbs}
                faqs={customFAQs}
            />

            <div>
                <Breadcrumbs
                    items={customBreadcrumbs.map(item => ({
                        name: item.name,
                        href: item.url.replace("https://gabrieltoth.com", ""),
                    }))}
                />
                <h1>Custom Page</h1>
            </div>
        </>
    )
}

/**
 * URL Structure Examples:
 *
 * Clean URLs with locale support:
 * - https://gabrieltoth.com (redirects to /en)
 * - https://gabrieltoth.com/en (English homepage)
 * - https://gabrieltoth.com/pt-BR (Portuguese homepage)
 * - https://gabrieltoth.com/en/channel-management (English service page)
 * - https://gabrieltoth.com/pt-BR/channel-management (Portuguese service page)
 *
 * SEO Files:
 * - https://gabrieltoth.com/robots.txt (Dynamic robots.txt)
 * - https://gabrieltoth.com/sitemap.xml (Main sitemap index)
 * - https://gabrieltoth.com/sitemap-en.xml (English sitemap)
 * - https://gabrieltoth.com/sitemap-pt-BR.xml (Portuguese sitemap)
 *
 * Structured Data Validation:
 * - Use Google's Rich Results Test: https://search.google.com/test/rich-results
 * - Use Schema.org validator: https://validator.schema.org/
 * - Check Search Console for structured data errors
 *
 * Meta Tags Validation:
 * - Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
 * - Use Twitter Card Validator: https://cards-dev.twitter.com/validator
 * - Use LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
 */

export default function SEOExamples() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">
                SEO Implementation Examples
            </h1>
            <p className="text-gray-600 mb-8">
                This page demonstrates various SEO implementations using our
                comprehensive system. Check the source code for detailed
                examples.
            </p>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4">
                        Available Examples:
                    </h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Basic SEO implementation</li>
                        <li>Service page with custom structured data</li>
                        <li>FAQ page with structured data</li>
                        <li>Article/Blog post with rich schema</li>
                        <li>Product/E-commerce page</li>
                        <li>Manual structured data configuration</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">
                        Key Features:
                    </h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>
                            ✅ JSON-LD Structured Data (Person, Website,
                            Organization, Service, FAQ, Breadcrumb)
                        </li>
                        <li>✅ Enhanced OpenGraph and Twitter Cards</li>
                        <li>✅ Clean URLs with i18n support</li>
                        <li>✅ Dynamic sitemap and robots.txt</li>
                        <li>✅ Automatic breadcrumb generation</li>
                        <li>✅ Next SEO integration</li>
                        <li>✅ TypeScript support</li>
                        <li>✅ Mobile-friendly and accessible</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
