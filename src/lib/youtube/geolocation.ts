/**
 * Geolocation Service
 * Uses Vercel native Edge Network headers for location detection
 * Validates: Requirements 5.1, 5.2
 */

import { createLogger } from "../logger"

/**
 * Geolocation information
 */
export interface GeolocationInfo {
    country: string
    countryName: string
    city: string
    state: string
    latitude: number
    longitude: number
    timezone: string
    isp: string
    isAccurate: boolean
    accuracyRadius: number
}

/**
 * Geolocation Service
 * Parses geolocation information from HTTP headers
 */
export class GeolocationService {
    private logger = createLogger("GeolocationService")

    /**
     * Get geolocation information from request headers
     * @param headers - Next.js Headers or raw headers object
     * @returns Geolocation information
     */
    getLocation(
        headers: Headers | Record<string, string | string[] | undefined>
    ): GeolocationInfo {
        let country = "Unknown"
        let city = "Unknown"
        let state = "Unknown"
        let latitude = 0
        let longitude = 0
        let timezone = "Unknown"

        // Helper to extract header regardless of object type
        const getHeader = (name: string): string => {
            if (typeof Headers !== "undefined" && headers instanceof Headers) {
                return headers.get(name) || ""
            }
            if (typeof headers === "object" && headers !== null) {
                const rawHeaders = headers as Record<
                    string,
                    string | string[] | undefined
                >
                const val = rawHeaders[name] || rawHeaders[name.toLowerCase()]
                return Array.isArray(val) ? val[0] : val || ""
            }
            return ""
        }

        const vercelCountry = getHeader("x-vercel-ip-country")
        if (vercelCountry) country = vercelCountry

        const vercelCity = getHeader("x-vercel-ip-city")
        if (vercelCity) city = decodeURIComponent(vercelCity)

        const vercelRegion = getHeader("x-vercel-ip-country-region")
        if (vercelRegion) state = vercelRegion

        const vercelLat = getHeader("x-vercel-ip-latitude")
        if (vercelLat && !isNaN(Number(vercelLat))) latitude = Number(vercelLat)

        const vercelLon = getHeader("x-vercel-ip-longitude")
        if (vercelLon && !isNaN(Number(vercelLon))) longitude = Number(vercelLon)

        const vercelTz = getHeader("x-vercel-ip-timezone")
        if (vercelTz) timezone = decodeURIComponent(vercelTz)

        this.logger.debug("Parsed geolocation from headers", { country, city })

        return {
            country,
            countryName: country, // Vercel only provides ISO code
            city,
            state,
            latitude,
            longitude,
            timezone,
            isp: "Unknown", // Vercel doesn't provide ISP natively without Edge Config
            isAccurate: true, // Header-based is considered accurate enough for our needs
            accuracyRadius: 50,
        }
    }

    /**
     * Compare two geolocation infos to detect changes
     * @param previous - Previous geolocation
     * @param current - Current geolocation
     * @returns Object indicating what changed
     */
    compareLocations(
        previous: GeolocationInfo,
        current: GeolocationInfo
    ): {
        countryChanged: boolean
        cityChanged: boolean
        stateChanged: boolean
        distanceKm: number
        significantChange: boolean
    } {
        const countryChanged = previous.country !== current.country
        const cityChanged = previous.city !== current.city
        const stateChanged = previous.state !== current.state

        // Calculate distance between coordinates using Haversine formula
        const distanceKm = this.calculateDistance(
            previous.latitude,
            previous.longitude,
            current.latitude,
            current.longitude
        )

        // Consider significant change if country changed or distance > 1000km
        const significantChange = countryChanged || distanceKm > 1000

        return {
            countryChanged,
            cityChanged,
            stateChanged,
            distanceKm,
            significantChange,
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371 // Earth's radius in kilometers
        const dLat = this.toRad(lat2 - lat1)
        const dLon = this.toRad(lon2 - lon1)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private toRad(degrees: number): number {
        return (degrees * Math.PI) / 180
    }
}

/**
 * Create a singleton instance of GeolocationService
 */
let geolocationServiceInstance: GeolocationService | null = null

/**
 * Get or create the geolocation service instance
 */
export function getGeolocationService(): GeolocationService {
    if (!geolocationServiceInstance) {
        geolocationServiceInstance = new GeolocationService()
    }
    return geolocationServiceInstance
}

/**
 * Reset the geolocation service (useful for testing)
 */
export function resetGeolocationService(): void {
    geolocationServiceInstance = null
}
