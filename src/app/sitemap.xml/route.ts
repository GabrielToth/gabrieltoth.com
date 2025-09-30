export const dynamic = "force-static"
export const revalidate = 86400
export async function GET() {
    const lastmod = new Date().toISOString()

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>https://www.gabrieltoth.com/sitemap-pt-BR.xml</loc>
        <lastmod>${lastmod}</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://www.gabrieltoth.com/sitemap-en.xml</loc>
        <lastmod>${lastmod}</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://www.gabrieltoth.com/sitemap-es.xml</loc>
        <lastmod>${lastmod}</lastmod>
    </sitemap>
    <sitemap>
        <loc>https://www.gabrieltoth.com/sitemap-de.xml</loc>
        <lastmod>${lastmod}</lastmod>
    </sitemap>
</sitemapindex>`

    return new Response(sitemap, {
        status: 200,
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "no-store",
        },
    })
}

export async function HEAD() {
    return new Response(null, {
        status: 200,
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "no-store",
        },
    })
}
