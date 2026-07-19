// SEO Sitemap
// Split from seo.ts — sitemap and robots.txt generators

const SITE_URL = "https://www.gabrieltoth.com"

// Get all pages for sitemap generation
export function getAllPages(): Array<{
    path: string
    priority: number
    changefreq: string
}> {
    return [
        { path: "", priority: 1.0, changefreq: "weekly" }, // Home
        { path: "/channel-management", priority: 0.8, changefreq: "monthly" },
        { path: "/editors", priority: 0.8, changefreq: "monthly" },
        { path: "/pc-optimization", priority: 0.8, changefreq: "monthly" },
        { path: "/pc-optimization/terms", priority: 0.3, changefreq: "yearly" },
        { path: "/amazon-affiliate", priority: 0.6, changefreq: "monthly" },
        { path: "/personality-test", priority: 0.7, changefreq: "weekly" },
        { path: "/privacy-policy", priority: 0.3, changefreq: "yearly" },
        { path: "/terms-of-service", priority: 0.3, changefreq: "yearly" },
    ]
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

# Host
Host: www.gabrieltoth.com`
}
