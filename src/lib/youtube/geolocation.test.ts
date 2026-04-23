/**
 * Geolocation Service Tests
 * Tests for GeoIP service integration and location detection
 * Validates: Requirements 5.1, 5.2
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GeolocationService } from "./geolocation"

describe("GeolocationService", () => {
    let service: GeolocationService

    beforeEach(() => {
        service = new GeolocationService({
            serviceUrl: "https://geoip.maxmind.com/geoip/v2.1/city",
            apiKey: "test-api-key",
            timeout: 5000,
            retries: 0, // Set retries to 0 for tests to avoid delays
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("constructor", () => {
        it("should create service with valid config", () => {
            const config = {
                serviceUrl: "https://geoip.maxmind.com/geoip/v2.1/city",
                apiKey: "test-api-key",
                timeout: 5000,
                retries: 3,
            }

            const svc = new GeolocationService(config)
            expect(svc).toBeDefined()
        })

        it("should throw error if service URL is missing", () => {
            expect(() => {
                new GeolocationService({
                    serviceUrl: "",
                    timeout: 5000,
                    retries: 3,
                })
            }).toThrow("Geolocation service URL is required")
        })

        it("should throw error if timeout is too low", () => {
            expect(() => {
                new GeolocationService({
                    serviceUrl: "https://geoip.maxmind.com/geoip/v2.1/city",
                    timeout: 500,
                    retries: 3,
                })
            }).toThrow("Geolocation timeout must be at least 1000ms")
        })

        it("should throw error if retries is negative", () => {
            expect(() => {
                new GeolocationService({
                    serviceUrl: "https://geoip.maxmind.com/geoip/v2.1/city",
                    timeout: 5000,
                    retries: -1,
                })
            }).toThrow("Geolocation retries must be non-negative")
        })
    })

    describe("getLocation", () => {
        it("should throw error if IP is empty", async () => {
            await expect(service.getLocation("")).rejects.toThrow(
                "IP address is required"
            )
        })

        it("should throw error if IP is null", async () => {
            await expect(service.getLocation(null as any)).rejects.toThrow(
                "IP address is required"
            )
        })

        it("should throw error if IP is not a string", async () => {
            await expect(service.getLocation(123 as any)).rejects.toThrow(
                "IP address is required"
            )
        })

        it("should handle whitespace in IP", async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

            await expect(
                service.getLocation("  203.0.113.42  ")
            ).rejects.toThrow()
        })
    })

    describe("compareLocations", () => {
        const location1 = {
            country: "US",
            countryName: "United States",
            city: "New York",
            state: "NY",
            latitude: 40.7128,
            longitude: -74.006,
            timezone: "America/New_York",
            isp: "ISP1",
            isAccurate: true,
            accuracyRadius: 10,
        }

        const location2 = {
            country: "US",
            countryName: "United States",
            city: "Los Angeles",
            state: "CA",
            latitude: 34.0522,
            longitude: -118.2437,
            timezone: "America/Los_Angeles",
            isp: "ISP2",
            isAccurate: true,
            accuracyRadius: 10,
        }

        const location3 = {
            country: "GB",
            countryName: "United Kingdom",
            city: "London",
            state: "England",
            latitude: 51.5074,
            longitude: -0.1278,
            timezone: "Europe/London",
            isp: "ISP3",
            isAccurate: true,
            accuracyRadius: 10,
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

        it("should detect significant change for country change", () => {
            const comparison = service.compareLocations(location1, location3)

            expect(comparison.significantChange).toBe(true)
        })

        it("should detect significant change for large distance", () => {
            const comparison = service.compareLocations(location1, location2)

            expect(comparison.significantChange).toBe(true)
        })
    })

    describe("clearCache", () => {
        it("should clear the cache", async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    country: { iso_code: "US", names: { en: "United States" } },
                    city: { names: { en: "New York" } },
                    location: {
                        latitude: 40.7128,
                        longitude: -74.006,
                        time_zone: "America/New_York",
                        accuracy_radius: 10,
                    },
                    traits: { isp: "ISP1" },
                }),
            })

            await service.getLocation("203.0.113.42")
            service.clearCache()

            const callCount = (global.fetch as any).mock.calls.length
            await service.getLocation("203.0.113.42")
            expect((global.fetch as any).mock.calls.length).toBeGreaterThan(
                callCount
            )
        })
    })

    describe("parseGeolocationResponse", () => {
        it("should parse MaxMind GeoIP2 format", () => {
            const response = {
                country: { iso_code: "US", names: { en: "United States" } },
                city: { names: { en: "New York" } },
                subdivisions: [{ iso_code: "NY" }],
                location: {
                    latitude: 40.7128,
                    longitude: -74.006,
                    time_zone: "America/New_York",
                    accuracy_radius: 10,
                },
                traits: { isp: "ISP1" },
            }

            const result = (service as any).parseGeolocationResponse(response)

            expect(result.country).toBe("US")
            expect(result.countryName).toBe("United States")
            expect(result.city).toBe("New York")
            expect(result.state).toBe("NY")
            expect(result.latitude).toBe(40.7128)
            expect(result.longitude).toBe(-74.006)
            expect(result.timezone).toBe("America/New_York")
            expect(result.isp).toBe("ISP1")
            expect(result.isAccurate).toBe(true)
            expect(result.accuracyRadius).toBe(10)
        })

        it("should parse generic format", () => {
            const response = {
                country: "US",
                countryName: "United States",
                city: "New York",
                state: "NY",
                latitude: 40.7128,
                longitude: -74.006,
                timezone: "America/New_York",
                isp: "ISP1",
                accuracyRadius: 10,
            }

            const result = (service as any).parseGeolocationResponse(response)

            expect(result.country).toBe("US")
            expect(result.countryName).toBe("United States")
            expect(result.city).toBe("New York")
            expect(result.latitude).toBe(40.7128)
            expect(result.longitude).toBe(-74.006)
        })

        it("should throw error for invalid response format", () => {
            const response = {
                invalid: "format",
            }

            expect(() => {
                ;(service as any).parseGeolocationResponse(response)
            }).toThrow("Invalid geolocation response format")
        })
    })

    describe("edge cases", () => {
        it("should handle IPv6 addresses", async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

            await expect(
                service.getLocation("2001:0db8:85a3::8a2e:0370:7334")
            ).rejects.toThrow()
        })

        it("should handle special characters in IP", async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

            await expect(
                service.getLocation("203.0.113.42!@#")
            ).rejects.toThrow()
        })

        it("should handle very long IP string", async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

            const longIP = "203.0.113.42" + "a".repeat(1000)
            await expect(service.getLocation(longIP)).rejects.toThrow()
        })
    })
})
