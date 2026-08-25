// SEO Sitemap
// Split from seo.ts — sitemap and robots.txt generators

import { type Locale, locales } from "@/lib/i18n"
import { getLocalizedUrl, getRouteKeyFromPath } from "@/lib/url-mapping"

const SITE_URL = "https://www.gabrieltoth.com"

export interface SitemapPage {
    key: string
    path: string
    priority: number
    changefreq: string
}

// Get all pages for sitemap generation
export function getAllPages(): SitemapPage[] {
    return [
        { key: "", path: "", priority: 1.0, changefreq: "weekly" }, // Home
        { key: "about-me", path: "/about-me", priority: 0.8, changefreq: "monthly" },
        { key: "services", path: "/services", priority: 0.8, changefreq: "monthly" },
        { key: "channel-management", path: "/channel-management", priority: 0.8, changefreq: "monthly" },
        { key: "editors", path: "/editors", priority: 0.8, changefreq: "monthly" },
        { key: "pc-optimization", path: "/pc-optimization", priority: 0.8, changefreq: "monthly" },
        { key: "pc-optimization/terms", path: "/pc-optimization/terms", priority: 0.3, changefreq: "yearly" },
        { key: "amazon-affiliate", path: "/amazon-affiliate", priority: 0.6, changefreq: "monthly" },
        { key: "minecraft", path: "/minecraft", priority: 0.7, changefreq: "weekly" },
        { key: "blog", path: "/blog", priority: 0.7, changefreq: "weekly" },
        { key: "privacy-policy", path: "/privacy-policy", priority: 0.3, changefreq: "yearly" },
        { key: "terms-of-service", path: "/terms-of-service", priority: 0.3, changefreq: "yearly" },
    ]
}

export function generateLocaleSitemap(locale: Locale): string {
    const pages = getAllPages()
    const currentDate = new Date().toISOString()

    const urlEntries = pages
        .map(({ key, path, priority, changefreq }) => {
            const routeKey = key || getRouteKeyFromPath(path)
            const getUrlForLocale = (targetLoc: Locale) => {
                const slug = routeKey ? getLocalizedUrl(routeKey, targetLoc) : path.replace(/^\/|\/$/g, "")
                const pathSegment = slug ? `/${slug}/` : "/"
                return `${SITE_URL}/${targetLoc}${pathSegment}`.replace(/\/+/g, "/").replace("https:/", "https://")
            }

            const locUrl = getUrlForLocale(locale)
            const ptUrl = getUrlForLocale("pt-BR")

            const alternateLinks = locales.map(targetLoc => {
                return `        <xhtml:link rel="alternate" hreflang="${targetLoc}" href="${getUrlForLocale(targetLoc)}" />`
            }).join("\n")

            return `
    <url>
        <loc>${locUrl}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
${alternateLinks}
        <xhtml:link rel="alternate" hreflang="x-default" href="${ptUrl}" />
    </url>`
        })
        .join("")

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
    ${urlEntries}
</urlset>`
}

// Enhanced robots.txt generator
export function generateRobotsContent(): string {
    return `# Robots.txt for ${SITE_URL}
# Generated automatically

User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
Disallow: /.well-known/
Disallow: /404
Disallow: /500

# Allow important files
Allow: /api/contact
Allow: /_next/static/
Allow: /_next/image

# Specific bot instructions
User-agent: Googlebot
Crawl-delay: 1

User-agent: Bingbot
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-en.xml
Sitemap: ${SITE_URL}/sitemap-pt-BR.xml
Sitemap: ${SITE_URL}/sitemap-es.xml
Sitemap: ${SITE_URL}/sitemap-de.xml
Sitemap: ${SITE_URL}/sitemap-fr.xml

# Host
Host: www.gabrieltoth.com`
}
