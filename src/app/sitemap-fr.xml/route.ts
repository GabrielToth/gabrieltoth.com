import { generateLocaleSitemap } from "@/lib/seo-sitemap"

export const dynamic = "force-static"
export const revalidate = 86400

export async function GET() {
    const sitemap = generateLocaleSitemap("fr")

    return new Response(sitemap, {
        status: 200,
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
    })
}

export async function HEAD() {
    return GET()
}
