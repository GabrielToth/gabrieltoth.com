export interface NominatimResult {
    place_id: number
    licence: string
    osm_type: string
    osm_id: number
    lat: string
    lon: string
    display_name: string
    type: string
    importance: number
    address?: {
        town?: string
        city?: string
        village?: string
        county?: string
        state?: string
        country?: string
        country_code?: string
    }
}

export interface TownResult {
    id: number
    name: string
    displayName: string
    lat: number
    lon: number
    type: string
}

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search"

export async function searchTowns(
    query: string,
    options: {
        limit?: number
        countryCodes?: string[]
        signal?: AbortSignal
    } = {}
): Promise<TownResult[]> {
    const trimmed = query.trim()
    if (trimmed.length < 2) return []

    const params = new URLSearchParams({
        q: trimmed,
        format: "jsonv2",
        addressdetails: "1",
        limit: String(options.limit ?? 8),
        "accept-language": "en,pt-BR,es,de,fr",
    })
    if (options.countryCodes?.length) {
        params.set("countrycodes", options.countryCodes.join(","))
    }

    const res = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
        signal: options.signal,
        headers: {
            Accept: "application/json",
        },
    })
    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

    const data: NominatimResult[] = await res.json()
    return data.map(item => ({
        id: item.place_id,
        name:
            item.address?.town ??
            item.address?.city ??
            item.address?.village ??
            item.display_name.split(",")[0],
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
    }))
}
