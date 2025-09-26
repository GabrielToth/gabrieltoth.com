export async function GET() {
    const lastmod = new Date().toISOString()

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>https://gabrieltoth.com/sitemap-en.xml</loc>
        <lastmod>${lastmod}</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://gabrieltoth.com/sitemap-pt-BR.xml</loc>
        <lastmod>${lastmod}</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://gabrieltoth.com/sitemap-es.xml</loc>
        <lastmod>${lastmod}</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://gabrieltoth.com/sitemap-de.xml</loc>
        <lastmod>${lastmod}</lastmod>
    </sitemap>
</sitemapindex>`

    return new Response(sitemap, {
        status: 200,
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=86400, s-max-age=86400", // Cache for 24 hours
        },
    })
}

export async function HEAD() {
    return new Response(null, {
        status: 200,
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=86400, s-max-age=86400",
        },
    })
}
