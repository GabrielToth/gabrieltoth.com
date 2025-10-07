export interface AmazonAffiliateOptions {
    url: string
    tag: string
}

function parseHostname(url: URL): string {
    const host = url.hostname
    if (host.includes("amazon.")) return host
    /* c8 ignore next */
    throw new Error("Not an Amazon domain")
}

function extractAsin(url: URL): string | null {
    // Common patterns: /dp/ASIN, /gp/product/ASIN, /ASIN
    const path = url.pathname
    const dpMatch = path.match(/\/dp\/([A-Z0-9]{10})/i)
    if (dpMatch) return dpMatch[1].toUpperCase()
    const gpMatch = path.match(/\/gp\/product\/([A-Z0-9]{10})/i)
    if (gpMatch) return gpMatch[1].toUpperCase()
    const asinMatch = path.match(/\/([A-Z0-9]{10})(?:[\/]|$)/i)
    if (asinMatch) return asinMatch[1].toUpperCase()
    // Fallback: query param asin
    const asinParam = url.searchParams.get("asin")
    return asinParam ? asinParam.toUpperCase() : null
}

export function generateAmazonAffiliateLink({
    url,
    tag,
}: AmazonAffiliateOptions): string {
    const input = new URL(url)
    const hostname = parseHostname(input)

    // Preserve marketplace
    const protocol = "https:"
    const asin = extractAsin(input)

    // If no ASIN, keep original path but ensure tag
    const base = `${protocol}//${hostname}`

    const out = new URL(
        asin ? `${base}/dp/${asin}` : `${base}${input.pathname}`
    )

    // Copy all original query params
    input.searchParams.forEach((value, key) => {
        out.searchParams.set(key, value)
    })

    // Set/override affiliate tag
    out.searchParams.set("tag", tag)

    return out.toString()
}
