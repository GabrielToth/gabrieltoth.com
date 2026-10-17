/**
 * Compliance Gate — controls use of "unofficial" scraping paths.
 *
 * The public site (gabrieltoth.com, operated under the CNPJ entity) must not
 * rely on scraping of third-party pages, because that may breach the platforms'
 * Terms of Service. Scraping is therefore gated behind an explicit opt-in:
 *
 *   ALLOW_UNOFFICIAL_SCRAPING=true
 *
 * Defaults to OFF everywhere. When OFF, routes must degrade gracefully to the
 * official API path (or return no data) instead of scraping HTML.
 *
 * The corresponding scraper implementations live outside this repository, in
 * `gabrieltoth-services/unofficial/` (operational fallback / salvaguarda).
 */

export function isUnofficialScrapingAllowed(): boolean {
    // Hard-block in production unless explicitly opt-in. This prevents a
    // misconfigured deploy from silently scraping under the public entity.
    const flag = process.env.ALLOW_UNOFFICIAL_SCRAPING?.trim().toLowerCase()
    if (flag === "true") return true
    if (flag === "false") return false
    return false
}

/**
 * Returns true when the caller should use official-API-only behavior.
 * Kept as the inverse for readability at call sites.
 */
export function isOfficialOnlyMode(): boolean {
    return !isUnofficialScrapingAllowed()
}
