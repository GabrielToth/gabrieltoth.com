/**
 * Geolocation Service
 * Integrates with GeoIP service (MaxMind or similar) for location detection
 * Validates: Requirements 5.1, 5.2
 */

import { createLogger } from "../logger"

/**
 * Geolocation information
 */
export interface GeolocationInfo {
    /**
     * Country code (ISO 3166-1 alpha-2)
     */
    country: string

    /**
     * Country name
     */
    countryName: string

    /**
     * City name
     */
    city: string

    /**
     * State/Province code
     */
    state: string

    /**
     * Latitude coordinate
     */
    latitude: number

    /**
     * Longitude coordinate
     */
    longitude: number

    /**
     * Timezone
     */
    timezone: string

    /**
     * ISP name
     */
    isp: string

    /**
     * Whether the location is accurate
     */
    isAccurate: boolean

    /**
     * Accuracy radius in kilometers
     */
    accuracyRadius: number
}

/**
 * Geolocation service configuration
 */
export interface GeolocationServiceConfig {
    /**
     * Service URL (e.g., https://geoip.maxmind.com/geoip/v2.1/city)
     */
    serviceUrl: string

    /**
     * API key for the geolocation service
     */
    apiKey?: string

    /**
     * Request timeout in milliseconds
     */
    timeout: number

    /**
     * Number of retries on failure
     */
    retries: number
}

/**
 * Geolocation Service
 * Fetches geolocation information for IP addresses
 */
export class GeolocationService {
    private logger = createLogger("GeolocationService")
    private config: GeolocationServiceConfig
    private cache: Map<string, GeolocationInfo> = new Map()
    private cacheExpiry: Map<string, number> = new Map()
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

    /**
     * Initialize the geolocation service
     * @param config - Service configuration
     */
    constructor(config: GeolocationServiceConfig) {
        this.config = config
        this.validateConfig()
    }

    /**
     * Validate the service configuration
     * @throws Error if configuration is invalid
     */
    private validateConfig(): void {
        if (!this.config.serviceUrl) {
            throw new Error("Geolocation service URL is required")
        }

        if (this.config.timeout < 1000) {
            throw new Error("Geolocation timeout must be at least 1000ms")
        }

        if (this.config.retries < 0) {
            throw new Error("Geolocation retries must be non-negative")
        }
    }

    /**
     * Get geolocation information for an IP address
     * @param ip - The IP address
     * @returns Geolocation information
     * @throws Error if geolocation lookup fails
     *
     * @example
     * const service = new GeolocationService({
     *   serviceUrl: 'https://geoip.maxmind.com/geoip/v2.1/city',
     *   apiKey: 'your-api-key',
     *   timeout: 5000,
     *   retries: 3
     * })
     * const location = await service.getLocation('203.0.113.42')
     * // Returns: { country: 'US', city: 'New York', latitude: 40.7128, ... }
     */
    async getLocation(ip: string): Promise<GeolocationInfo> {
        if (!ip || typeof ip !== "string") {
            throw new Error("IP address is required")
        }

        const trimmedIp = ip.trim()

        // Check cache first
        const cached = this.getFromCache(trimmedIp)
        if (cached) {
            this.logger.debug(`Geolocation cache hit for ${trimmedIp}`)
            return cached
        }

        // Fetch from service with retries
        let lastError: Error | null = null

        for (let attempt = 0; attempt <= this.config.retries; attempt++) {
            try {
                const location = await this.fetchLocation(trimmedIp)
                this.setCache(trimmedIp, location)
                return location
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error))
                this.logger.warn(
                    `Geolocation lookup failed for ${trimmedIp} (attempt ${attempt + 1}/${this.config.retries + 1})`,
                    lastError
                )

                // Wait before retrying (exponential backoff)
                if (attempt < this.config.retries) {
                    await this.delay(Math.pow(2, attempt) * 1000)
                }
            }
        }

        throw new Error(
            `Failed to get geolocation for ${trimmedIp}: ${lastError?.message || "Unknown error"}`
        )
    }

    /**
     * Fetch geolocation information from the service
     * @param ip - The IP address
     * @returns Geolocation information
     * @throws Error if fetch fails
     */
    private async fetchLocation(ip: string): Promise<GeolocationInfo> {
        const url = new URL(this.config.serviceUrl)
        url.searchParams.append("ip", ip)

        if (this.config.apiKey) {
            url.searchParams.append("key", this.config.apiKey)
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(
            () => controller.abort(),
            this.config.timeout
        )

        try {
            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
            })

            if (!response.ok) {
                throw new Error(
                    `Geolocation service returned ${response.status}: ${response.statusText}`
                )
            }

            const data = await response.json()
            return this.parseGeolocationResponse(data)
        } finally {
            clearTimeout(timeoutId)
        }
    }

    /**
     * Parse geolocation response from the service
     * Supports MaxMind GeoIP2 format
     * @param data - Response data from geolocation service
     * @returns Parsed geolocation information
     * @throws Error if response format is invalid
     */
    private parseGeolocationResponse(data: any): GeolocationInfo {
        // Support MaxMind GeoIP2 format
        if (data.country && data.location) {
            return {
                country: data.country.iso_code || "Unknown",
                countryName: data.country.names?.en || "Unknown",
                city: data.city?.names?.en || "Unknown",
                state: data.subdivisions?.[0]?.iso_code || "Unknown",
                latitude: data.location.latitude || 0,
                longitude: data.location.longitude || 0,
                timezone: data.location.time_zone || "Unknown",
                isp: data.traits?.isp || "Unknown",
                isAccurate: (data.location.accuracy_radius || 0) <= 100,
                accuracyRadius: data.location.accuracy_radius || 0,
            }
        }

        // Support generic format
        if (data.latitude !== undefined && data.longitude !== undefined) {
            return {
                country: data.country || "Unknown",
                countryName: data.countryName || "Unknown",
                city: data.city || "Unknown",
                state: data.state || "Unknown",
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone || "Unknown",
                isp: data.isp || "Unknown",
                isAccurate: (data.accuracyRadius || 0) <= 100,
                accuracyRadius: data.accuracyRadius || 0,
            }
        }

        throw new Error("Invalid geolocation response format")
    }

    /**
     * Get geolocation from cache if available and not expired
     * @param ip - The IP address
     * @returns Cached geolocation or null
     */
    private getFromCache(ip: string): GeolocationInfo | null {
        const cached = this.cache.get(ip)
        const expiry = this.cacheExpiry.get(ip)

        if (!cached || !expiry || Date.now() > expiry) {
            this.cache.delete(ip)
            this.cacheExpiry.delete(ip)
            return null
        }

        return cached
    }

    /**
     * Store geolocation in cache
     * @param ip - The IP address
     * @param location - Geolocation information
     */
    private setCache(ip: string, location: GeolocationInfo): void {
        this.cache.set(ip, location)
        this.cacheExpiry.set(ip, Date.now() + this.CACHE_TTL)
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache.clear()
        this.cacheExpiry.clear()
        this.logger.debug("Geolocation cache cleared")
    }

    /**
     * Compare two geolocation infos to detect changes
     * @param previous - Previous geolocation
     * @param current - Current geolocation
     * @returns Object indicating what changed
     *
     * @example
     * const changes = service.compareLocations(previousLocation, currentLocation)
     * // Returns: { countryChanged: true, cityChanged: false, distanceKm: 1234.5 }
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
     * @param lat1 - First latitude
     * @param lon1 - First longitude
     * @param lat2 - Second latitude
     * @param lon2 - Second longitude
     * @returns Distance in kilometers
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

    /**
     * Convert degrees to radians
     * @param degrees - Degrees value
     * @returns Radians value
     */
    private toRad(degrees: number): number {
        return (degrees * Math.PI) / 180
    }

    /**
     * Delay execution for a specified time
     * @param ms - Milliseconds to delay
     * @returns Promise that resolves after delay
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}

/**
 * Create a singleton instance of GeolocationService
 */
let geolocationServiceInstance: GeolocationService | null = null

/**
 * Get or create the geolocation service instance
 * @param config - Service configuration (required on first call)
 * @returns The geolocation service instance
 */
export function getGeolocationService(
    config?: GeolocationServiceConfig
): GeolocationService {
    if (!geolocationServiceInstance) {
        if (!config) {
            throw new Error(
                "Geolocation service configuration is required on first call"
            )
        }
        geolocationServiceInstance = new GeolocationService(config)
    }
    return geolocationServiceInstance
}

/**
 * Reset the geolocation service (useful for testing)
 */
export function resetGeolocationService(): void {
    geolocationServiceInstance = null
}
