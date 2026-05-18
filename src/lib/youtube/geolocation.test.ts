/**
 * Geolocation Service Tests
 * Tests for Vercel Headers geolocation parsing
 * Validates: Requirements 5.1, 5.2
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { GeolocationService } from "./geolocation"

describe("GeolocationService", () => {
    let service: GeolocationService

    beforeEach(() => {
        service = new GeolocationService()
    })

    describe("getLocation", () => {
        it("should return default location when no headers are provided", () => {
            const location = service.getLocation({})

            expect(location.country).toBe("Unknown")
            expect(location.city).toBe("Unknown")
            expect(location.state).toBe("Unknown")
            expect(location.latitude).toBe(0)
            expect(location.longitude).toBe(0)
            expect(location.timezone).toBe("Unknown")
        })

        it("should parse location from raw object headers", () => {
            const headers = {
                "x-vercel-ip-country": "US",
                "x-vercel-ip-city": "New%20York",
                "x-vercel-ip-country-region": "NY",
                "x-vercel-ip-latitude": "40.7128",
                "x-vercel-ip-longitude": "-74.0060",
                "x-vercel-ip-timezone": "America%2FNew_York",
            }

            const location = service.getLocation(headers)

            expect(location.country).toBe("US")
            expect(location.countryName).toBe("US")
            expect(location.city).toBe("New York")
            expect(location.state).toBe("NY")
            expect(location.latitude).toBe(40.7128)
            expect(location.longitude).toBe(-74.006)
            expect(location.timezone).toBe("America/New_York")
            expect(location.isp).toBe("Unknown")
            expect(location.isAccurate).toBe(true)
        })

        it("should parse location from standard Headers object", () => {
            const headers = new Headers({
                "x-vercel-ip-country": "BR",
                "x-vercel-ip-city": "Sao%20Paulo",
                "x-vercel-ip-country-region": "SP",
                "x-vercel-ip-latitude": "-23.5505",
                "x-vercel-ip-longitude": "-46.6333",
                "x-vercel-ip-timezone": "America%2FSao_Paulo",
            })

            const location = service.getLocation(headers)

            expect(location.country).toBe("BR")
            expect(location.city).toBe("Sao Paulo")
            expect(location.state).toBe("SP")
            expect(location.latitude).toBe(-23.5505)
            expect(location.longitude).toBe(-46.6333)
            expect(location.timezone).toBe("America/Sao_Paulo")
        })

        it("should handle missing or malformed latitude/longitude gracefully", () => {
            const headers = {
                "x-vercel-ip-country": "FR",
                "x-vercel-ip-latitude": "invalid",
                "x-vercel-ip-longitude": "NaN",
            }

            const location = service.getLocation(headers)

            expect(location.country).toBe("FR")
            expect(location.latitude).toBe(0)
            expect(location.longitude).toBe(0)
        })
    })

    describe("compareLocations", () => {
        const location1 = {
            country: "US",
            countryName: "US",
            city: "New York",
            state: "NY",
            latitude: 40.7128,
            longitude: -74.006,
            timezone: "America/New_York",
            isp: "Unknown",
            isAccurate: true,
            accuracyRadius: 50,
        }

        const location2 = {
            country: "US",
            countryName: "US",
            city: "Los Angeles",
            state: "CA",
            latitude: 34.0522,
            longitude: -118.2437,
            timezone: "America/Los_Angeles",
            isp: "Unknown",
            isAccurate: true,
            accuracyRadius: 50,
        }

        const location3 = {
            country: "GB",
            countryName: "GB",
            city: "London",
            state: "England",
            latitude: 51.5074,
            longitude: -0.1278,
            timezone: "Europe/London",
            isp: "Unknown",
            isAccurate: true,
            accuracyRadius: 50,
        }

        it("should detect no changes for same location", () => {
            const comparison = service.compareLocations(location1, location1)

            expect(comparison.countryChanged).toBe(false)
            expect(comparison.cityChanged).toBe(false)
            expect(comparison.stateChanged).toBe(false)
            expect(comparison.distanceKm).toBe(0)
            expect(comparison.significantChange).toBe(false)
        })

        it("should detect city change within same country", () => {
            const comparison = service.compareLocations(location1, location2)

            expect(comparison.countryChanged).toBe(false)
            expect(comparison.cityChanged).toBe(true)
            expect(comparison.stateChanged).toBe(true)
            expect(comparison.distanceKm).toBeGreaterThan(0)
            expect(comparison.significantChange).toBe(true)
        })

        it("should detect country change", () => {
            const comparison = service.compareLocations(location1, location3)

            expect(comparison.countryChanged).toBe(true)
            expect(comparison.cityChanged).toBe(true)
            expect(comparison.significantChange).toBe(true)
        })

        it("should calculate distance correctly", () => {
            const comparison = service.compareLocations(location1, location2)

            expect(comparison.distanceKm).toBeGreaterThan(3900)
            expect(comparison.distanceKm).toBeLessThan(4000)
        })
    })
})
