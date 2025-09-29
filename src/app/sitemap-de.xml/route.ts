import { getAllPages } from "@/lib/seo"
export const dynamic = "force-dynamic"
export const revalidate = 0

const SITE_URL = "https://gabrieltoth.com"

export async function GET() {
    const pages = getAllPages()
    const currentDate = new Date().toISOString()

    const urlEntries = pages
        .map(({ path, priority, changefreq }) => {
            const fullUrl = `${SITE_URL}/de${path}`
            const enUrl = `${SITE_URL}/en${path}`
            const ptUrl = `${SITE_URL}/pt-BR${path}`
            const esUrl = `${SITE_URL}/es${path}`

            return `
    <url>
        <loc>${fullUrl}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
        <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
        <xhtml:link rel="alternate" hreflang="pt-BR" href="${ptUrl}" />
        <xhtml:link rel="alternate" hreflang="es" href="${esUrl}" />
        <xhtml:link rel="alternate" hreflang="de" href="${fullUrl}" />
        <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
    </url>`
        })
        .join("")

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
    ${urlEntries}
</urlset>`

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
