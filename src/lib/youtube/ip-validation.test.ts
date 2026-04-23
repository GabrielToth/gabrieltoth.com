/**
 * IP Validation Service Tests
 * Tests for IP address validation and extraction
 * Validates: Requirements 5.1, 5.2
 */

import { IncomingMessage } from "http"
import { beforeEach, describe, expect, it } from "vitest"
import { IPValidationService } from "./ip-validation"

describe("IPValidationService", () => {
    let service: IPValidationService

    beforeEach(() => {
        service = new IPValidationService()
    })

    describe("validateIP", () => {
        describe("IPv4 validation", () => {
            it("should validate valid IPv4 address", () => {
                const result = service.validateIP("203.0.113.42")

                expect(result.isValid).toBe(true)
                expect(result.version).toBe(4)
                expect(result.address).toBe("203.0.113.42")
            })

            it("should validate IPv4 with all zeros", () => {
                const result = service.validateIP("0.0.0.0")

                expect(result.isValid).toBe(true)
                expect(result.version).toBe(4)
            })

            it("should validate IPv4 with all 255s", () => {
                const result = service.validateIP("255.255.255.255")

                expect(result.isValid).toBe(true)
                expect(result.version).toBe(4)
            })

            it("should reject invalid IPv4 with out of range octets", () => {
                const result = service.validateIP("256.0.0.1")

                expect(result.isValid).toBe(false)
                expect(result.version).toBeNull()
            })

            it("should reject invalid IPv4 with missing octets", () => {
                const result = service.validateIP("192.168.1")

                expect(result.isValid).toBe(false)
            })

            it("should reject invalid IPv4 with extra octets", () => {
                const result = service.validateIP("192.168.1.1.1")

                expect(result.isValid).toBe(false)
            })

            it("should reject invalid IPv4 with non-numeric characters", () => {
                const result = service.validateIP("192.168.1.a")

                expect(result.isValid).toBe(false)
            })
        })

        describe("IPv6 validation", () => {
            it("should validate valid IPv6 address", () => {
                const result = service.validateIP(
                    "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
                )

                expect(result.isValid).toBe(true)
                expect(result.version).toBe(6)
            })

            it("should validate IPv6 loopback", () => {
                const result = service.validateIP("::1")

                expect(result.isValid).toBe(true)
                expect(result.version).toBe(6)
            })

            it("should validate IPv6 all zeros", () => {
                const result = service.validateIP("::")

                expect(result.isValid).toBe(true)
                expect(result.version).toBe(6)
            })

            it("should reject invalid IPv6", () => {
                const result = service.validateIP("gggg::1")

                expect(result.isValid).toBe(false)
            })
        })

        describe("private IP detection", () => {
            it("should detect private IPv4 10.0.0.0/8", () => {
                const result = service.validateIP("10.0.0.1")

                expect(result.isPrivate).toBe(true)
            })

            it("should detect private IPv4 172.16.0.0/12", () => {
                const result = service.validateIP("172.16.0.1")

                expect(result.isPrivate).toBe(true)
            })

            it("should detect private IPv4 192.168.0.0/16", () => {
                const result = service.validateIP("192.168.1.1")

                expect(result.isPrivate).toBe(true)
            })

            it("should detect public IPv4", () => {
                const result = service.validateIP("203.0.113.42")

                expect(result.isPrivate).toBe(false)
            })

            it("should detect private IPv6", () => {
                const result = service.validateIP("fc00::1")

                expect(result.isPrivate).toBe(true)
            })

            it("should detect public IPv6", () => {
                const result = service.validateIP(
                    "2001:0db8:85a3::8a2e:0370:7334"
                )

                expect(result.isPrivate).toBe(false)
            })
        })

        describe("loopback detection", () => {
            it("should detect IPv4 loopback", () => {
                const result = service.validateIP("127.0.0.1")

                expect(result.isLoopback).toBe(true)
            })

            it("should detect IPv6 loopback", () => {
                const result = service.validateIP("::1")

                expect(result.isLoopback).toBe(true)
            })

            it("should not detect non-loopback as loopback", () => {
                const result = service.validateIP("203.0.113.42")

                expect(result.isLoopback).toBe(false)
            })
        })

        describe("multicast detection", () => {
            it("should detect IPv4 multicast", () => {
                const result = service.validateIP("224.0.0.1")

                expect(result.isMulticast).toBe(true)
            })

            it("should detect IPv6 multicast", () => {
                const result = service.validateIP("ff00::1")

                expect(result.isMulticast).toBe(true)
            })

            it("should not detect non-multicast as multicast", () => {
                const result = service.validateIP("203.0.113.42")

                expect(result.isMulticast).toBe(false)
            })
        })

        describe("edge cases", () => {
            it("should handle empty string", () => {
                const result = service.validateIP("")

                expect(result.isValid).toBe(false)
            })

            it("should handle null", () => {
                const result = service.validateIP(null as any)

                expect(result.isValid).toBe(false)
            })

            it("should handle whitespace", () => {
                const result = service.validateIP("  203.0.113.42  ")

                expect(result.isValid).toBe(true)
                expect(result.address).toBe("203.0.113.42")
            })

            it("should handle undefined", () => {
                const result = service.validateIP(undefined as any)

                expect(result.isValid).toBe(false)
            })
        })
    })

    describe("extractIPFromRequest", () => {
        it("should extract IP from X-Forwarded-For header", () => {
            const request = {
                headers: {
                    "x-forwarded-for": "203.0.113.42, 198.51.100.1",
                },
            } as any as IncomingMessage

            const ip = service.extractIPFromRequest(request)

            expect(ip).toBe("203.0.113.42")
        })

        it("should extract IP from X-Real-IP header", () => {
            const request = {
                headers: {
                    "x-real-ip": "203.0.113.42",
                },
            } as any as IncomingMessage

            const ip = service.extractIPFromRequest(request)

            expect(ip).toBe("203.0.113.42")
        })

        it("should extract IP from CF-Connecting-IP header", () => {
            const request = {
                headers: {
                    "cf-connecting-ip": "203.0.113.42",
                },
            } as any as IncomingMessage

            const ip = service.extractIPFromRequest(request)

            expect(ip).toBe("203.0.113.42")
        })

        it("should prefer X-Forwarded-For over X-Real-IP", () => {
            const request = {
                headers: {
                    "x-forwarded-for": "203.0.113.42",
                    "x-real-ip": "198.51.100.1",
                },
            } as any as IncomingMessage

            const ip = service.extractIPFromRequest(request)

            expect(ip).toBe("203.0.113.42")
        })

        it("should handle array of IPs in X-Forwarded-For", () => {
            const request = {
                headers: {
                    "x-forwarded-for": ["203.0.113.42", "198.51.100.1"],
                },
            } as any as IncomingMessage

            const ip = service.extractIPFromRequest(request)

            expect(ip).toBe("203.0.113.42")
        })

        it("should fall back to socket address", () => {
            const request = {
                headers: {},
                socket: {
                    remoteAddress: "203.0.113.42",
                },
            } as any as IncomingMessage

            const ip = service.extractIPFromRequest(request)

            expect(ip).toBe("203.0.113.42")
        })

        it("should return 0.0.0.0 if no IP found", () => {
            const request = {
                headers: {},
            } as any as IncomingMessage

            const ip = service.extractIPFromRequest(request)

            expect(ip).toBe("0.0.0.0")
        })

        it("should handle invalid IPs in headers", () => {
            const request = {
                headers: {
                    "x-forwarded-for": "invalid-ip",
                    "x-real-ip": "203.0.113.42",
                },
            } as any as IncomingMessage

            const ip = service.extractIPFromRequest(request)

            expect(ip).toBe("203.0.113.42")
        })
    })

    describe("compareIPs", () => {
        it("should return true for same IPs", () => {
            const result = service.compareIPs("203.0.113.42", "203.0.113.42")

            expect(result).toBe(true)
        })

        it("should return false for different IPs", () => {
            const result = service.compareIPs("203.0.113.42", "198.51.100.1")

            expect(result).toBe(false)
        })

        it("should be case-insensitive for IPv6", () => {
            const result = service.compareIPs(
                "2001:0DB8:85A3::8A2E:0370:7334",
                "2001:0db8:85a3::8a2e:0370:7334"
            )

            expect(result).toBe(true)
        })

        it("should handle whitespace", () => {
            const result = service.compareIPs(
                "  203.0.113.42  ",
                "203.0.113.42"
            )

            expect(result).toBe(true)
        })
    })
})
