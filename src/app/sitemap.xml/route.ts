const SITE_URL = "https://gabrieltoth.com"

export async function GET() {
    const currentDate = new Date().toISOString()

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${SITE_URL}/sitemap-en.xml</loc>
        <lastmod>${currentDate}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${SITE_URL}/sitemap-pt-BR.xml</loc>
        <lastmod>${currentDate}</lastmod>
    </sitemap>
</sitemapindex>`

    return new Response(sitemapIndex, {
        status: 200,
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=86400, s-max-age=86400", // Cache for 24 hours
        },
    })
}
