/**
 * Device Detection Service Tests
 * Tests for device type detection from user agent strings
 * Validates: Requirements 5.1, 5.2
 */

import { describe, expect, it } from "vitest"
import { DeviceDetectionService } from "./device-detection"

describe("DeviceDetectionService", () => {
    let service: DeviceDetectionService

    beforeEach(() => {
        service = new DeviceDetectionService()
    })

    describe("detectDevice", () => {
        it("should detect iPhone as mobile", () => {
            const userAgent =
                "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
            const device = service.detectDevice(userAgent)

            expect(device.type).toBe("mobile")
            expect(device.isMobile).toBe(true)
            expect(device.isTablet).toBe(false)
            expect(device.isDesktop).toBe(false)
            expect(device.os).toBe("iOS")
        })

        it("should detect iPad as tablet", () => {
            const userAgent =
                "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
            const device = service.detectDevice(userAgent)

            expect(device.type).toBe("tablet")
            expect(device.isTablet).toBe(true)
            expect(device.isMobile).toBe(false)
            expect(device.isDesktop).toBe(false)
            expect(device.os).toBe("iOS")
        })

        it("should detect Android phone as mobile", () => {
            const userAgent =
                "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36"
            const device = service.detectDevice(userAgent)

            expect(device.type).toBe("mobile")
            expect(device.isMobile).toBe(true)
            expect(device.os).toBe("Android")
        })

        it("should detect Android tablet as tablet", () => {
            const userAgent =
                "Mozilla/5.0 (Linux; Android 11; Nexus 10) AppleWebKit/537.36"
            const device = service.detectDevice(userAgent)

            expect(device.type).toBe("tablet")
            expect(device.isTablet).toBe(true)
            expect(device.os).toBe("Android")
        })

        it("should detect Windows desktop as desktop", () => {
            const userAgent =
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124"
            const device = service.detectDevice(userAgent)

            expect(device.type).toBe("desktop")
            expect(device.isDesktop).toBe(true)
            expect(device.os).toBe("Windows")
        })

        it("should detect macOS desktop as desktop", () => {
            const userAgent =
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/91.0.4472.124"
            const device = service.detectDevice(userAgent)

            expect(device.type).toBe("desktop")
            expect(device.isDesktop).toBe(true)
            expect(device.os).toBe("macOS")
        })

        it("should detect Linux desktop as desktop", () => {
            const userAgent =
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/91.0.4472.124"
            const device = service.detectDevice(userAgent)

            expect(device.type).toBe("desktop")
            expect(device.isDesktop).toBe(true)
            expect(device.os).toBe("Linux")
        })

        it("should detect Chrome browser", () => {
            const userAgent =
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124"
            const device = service.detectDevice(userAgent)

            expect(device.browser).toBe("Chrome")
            expect(device.browserVersion).toBe("91")
        })

        it("should detect Firefox browser", () => {
            const userAgent =
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"
            const device = service.detectDevice(userAgent)

            expect(device.browser).toBe("Firefox")
            expect(device.browserVersion).toBe("89")
        })

        it("should detect Safari browser", () => {
            const userAgent =
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/14.1.1 Safari/605.1.15"
            const device = service.detectDevice(userAgent)

            expect(device.browser).toBe("Safari")
            expect(device.browserVersion).toBe("14")
        })

        it("should detect Edge browser", () => {
            const userAgent =
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59"
            const device = service.detectDevice(userAgent)

            expect(device.browser).toBe("Edge")
            expect(device.browserVersion).toBe("91")
        })

        it("should handle empty user agent", () => {
            const device = service.detectDevice("")

            expect(device.type).toBe("unknown")
            expect(device.os).toBe("Unknown")
            expect(device.browser).toBe("Unknown")
        })

        it("should handle null user agent", () => {
            const device = service.detectDevice(null as any)

            expect(device.type).toBe("unknown")
            expect(device.os).toBe("Unknown")
        })

        it("should preserve original user agent", () => {
            const userAgent =
                "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
            const device = service.detectDevice(userAgent)

            expect(device.userAgent).toBe(userAgent)
        })
    })

    describe("compareDevices", () => {
        it("should detect device type change", () => {
            const device1 = service.detectDevice(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
            )
            const device2 = service.detectDevice(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )

            const comparison = service.compareDevices(device1, device2)

            expect(comparison.deviceTypeChanged).toBe(true)
            expect(comparison.anyChanged).toBe(true)
        })

        it("should detect OS change", () => {
            const device1 = service.detectDevice(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0"
            )
            const device2 = service.detectDevice(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/91.0"
            )

            const comparison = service.compareDevices(device1, device2)

            expect(comparison.osChanged).toBe(true)
            expect(comparison.anyChanged).toBe(true)
        })

        it("should detect browser change", () => {
            const device1 = service.detectDevice(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0"
            )
            const device2 = service.detectDevice(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"
            )

            const comparison = service.compareDevices(device1, device2)

            expect(comparison.browserChanged).toBe(true)
            expect(comparison.anyChanged).toBe(true)
        })

        it("should detect no changes for same device", () => {
            const userAgent =
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0"
            const device1 = service.detectDevice(userAgent)
            const device2 = service.detectDevice(userAgent)

            const comparison = service.compareDevices(device1, device2)

            expect(comparison.deviceTypeChanged).toBe(false)
            expect(comparison.osChanged).toBe(false)
            expect(comparison.browserChanged).toBe(false)
            expect(comparison.anyChanged).toBe(false)
        })
    })

    describe("edge cases", () => {
        it("should handle very long user agent", () => {
            const longUserAgent = "a".repeat(10000)
            const device = service.detectDevice(longUserAgent)

            expect(device.userAgent).toBe(longUserAgent)
            // Very long user agent with no recognizable patterns defaults to desktop
            expect(device.type).toBe("desktop")
        })

        it("should handle user agent with special characters", () => {
            const userAgent =
                "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) !@#$%^&*()"
            const device = service.detectDevice(userAgent)

            expect(device.type).toBe("mobile")
            expect(device.os).toBe("iOS")
        })

        it("should handle case-insensitive matching", () => {
            const userAgent1 =
                "mozilla/5.0 (iphone; cpu iphone os 14_0 like mac os x)"
            const userAgent2 =
                "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"

            const device1 = service.detectDevice(userAgent1)
            const device2 = service.detectDevice(userAgent2)

            expect(device1.type).toBe(device2.type)
            expect(device1.os).toBe(device2.os)
        })

        it("should handle Kindle as tablet", () => {
            const userAgent =
                "Mozilla/5.0 (Linux; U; Android 4.4.2; en-us; Kindle Fire Build/KTU84M) AppleWebKit/537.36"
            const device = service.detectDevice(userAgent)

            expect(device.type).toBe("tablet")
            expect(device.isTablet).toBe(true)
        })

        it("should handle Samsung Internet browser", () => {
            const userAgent =
                "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 SamsungBrowser/14.0"
            const device = service.detectDevice(userAgent)

            expect(device.browser).toBe("Samsung Internet")
            expect(device.browserVersion).toBe("14")
        })
    })
})
