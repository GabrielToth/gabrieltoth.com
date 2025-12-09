"use client"

interface SeoProviderProps {
    children: React.ReactNode
}

/**
 * SEO Provider component
 * Note: In Next.js 15+ App Router, SEO is handled natively via generateMetadata
 * This component is kept for backwards compatibility but no longer uses DefaultSeo
 * from next-seo as it was removed in v7 (now focused on JSON-LD only)
 */
const SeoProvider = ({ children }: SeoProviderProps) => {
    return <>{children}</>
}

export default SeoProvider
