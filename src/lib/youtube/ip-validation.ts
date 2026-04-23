/**
 * IP Address Validation Service
 * Validates and extracts IP addresses from requests
 * Validates: Requirements 5.1, 5.2
 */

import { IncomingMessage } from "http"

/**
 * IP address information
 */
export interface IPInfo {
    /**
     * The IP address
     */
    address: string

    /**
     * Whether the IP is valid
     */
    isValid: boolean

    /**
     * IP version (4 or 6)
     */
    version: 4 | 6 | null

    /**
     * Whether the IP is private/internal
     */
    isPrivate: boolean

    /**
     * Whether the IP is a loopback address
     */
    isLoopback: boolean

    /**
     * Whether the IP is a multicast address
     */
    isMulticast: boolean
}

/**
 * IP Address Validation Service
 * Validates IP addresses and extracts them from requests
 */
export class IPValidationService {
    /**
     * IPv4 private ranges
     */
    private static readonly IPV4_PRIVATE_RANGES = [
        { start: "10.0.0.0", end: "10.255.255.255" },
        { start: "172.16.0.0", end: "172.31.255.255" },
        { start: "192.168.0.0", end: "192.168.255.255" },
        { start: "127.0.0.0", end: "127.255.255.255" }, // Loopback
        { start: "169.254.0.0", end: "169.254.255.255" }, // Link-local
    ]

    /**
     * IPv4 multicast range
     */
    private static readonly IPV4_MULTICAST_START = "224.0.0.0"
    private static readonly IPV4_MULTICAST_END = "239.255.255.255"

    /**
     * Extract IP address from request
     * Checks X-Forwarded-For, X-Real-IP, and socket address
     * @param request - The HTTP request
     * @returns The IP address
     *
     * @example
     * const service = new IPValidationService()
     * const ip = service.extractIPFromRequest(req)
     * // Returns: '203.0.113.42'
     */
    extractIPFromRequest(request: IncomingMessage): string {
        // Check X-Forwarded-For header (for proxies)
        const xForwardedFor = request.headers["x-forwarded-for"]
        if (xForwardedFor) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            const ips = Array.isArray(xForwardedFor)
                ? xForwardedFor[0]
                : xForwardedFor
            const firstIp = ips.split(",")[0].trim()
            if (this.isValidIPAddress(firstIp)) {
                return firstIp
            }
        }

        // Check X-Real-IP header
        const xRealIp = request.headers["x-real-ip"]
        if (xRealIp) {
            const ip = Array.isArray(xRealIp) ? xRealIp[0] : xRealIp
            if (this.isValidIPAddress(ip)) {
                return ip
            }
        }

        // Check CF-Connecting-IP header (Cloudflare)
        const cfConnectingIp = request.headers["cf-connecting-ip"]
        if (cfConnectingIp) {
            const ip = Array.isArray(cfConnectingIp)
                ? cfConnectingIp[0]
                : cfConnectingIp
            if (this.isValidIPAddress(ip)) {
                return ip
            }
        }

        // Fall back to socket address
        const socketAddress =
            request.socket?.remoteAddress ||
            (request as any).connection?.remoteAddress
        if (socketAddress && this.isValidIPAddress(socketAddress)) {
            return socketAddress
        }

        return "0.0.0.0"
    }

    /**
     * Validate an IP address
     * @param ip - The IP address to validate
     * @returns IP information
     *
     * @example
     * const service = new IPValidationService()
     * const info = service.validateIP('203.0.113.42')
     * // Returns: { address: '203.0.113.42', isValid: true, version: 4, ... }
     */
    validateIP(ip: string): IPInfo {
        if (!ip || typeof ip !== "string") {
            return {
                address: ip || "",
                isValid: false,
                version: null,
                isPrivate: false,
                isLoopback: false,
                isMulticast: false,
            }
        }

        const trimmedIp = ip.trim()

        // Check IPv4
        if (this.isValidIPv4(trimmedIp)) {
            return {
                address: trimmedIp,
                isValid: true,
                version: 4,
                isPrivate: this.isPrivateIPv4(trimmedIp),
                isLoopback: this.isLoopbackIPv4(trimmedIp),
                isMulticast: this.isMulticastIPv4(trimmedIp),
            }
        }

        // Check IPv6
        if (this.isValidIPv6(trimmedIp)) {
            return {
                address: trimmedIp,
                isValid: true,
                version: 6,
                isPrivate: this.isPrivateIPv6(trimmedIp),
                isLoopback: this.isLoopbackIPv6(trimmedIp),
                isMulticast: this.isMulticastIPv6(trimmedIp),
            }
        }

        return {
            address: trimmedIp,
            isValid: false,
            version: null,
            isPrivate: false,
            isLoopback: false,
            isMulticast: false,
        }
    }

    /**
     * Check if an IP address is valid (IPv4 or IPv6)
     * @param ip - The IP address to check
     * @returns True if valid
     */
    private isValidIPAddress(ip: string): boolean {
        return this.isValidIPv4(ip) || this.isValidIPv6(ip)
    }

    /**
     * Check if an IP address is valid IPv4
     * @param ip - The IP address to check
     * @returns True if valid IPv4
     */
    private isValidIPv4(ip: string): boolean {
        const ipv4Regex =
            /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
        return ipv4Regex.test(ip)
    }

    /**
     * Check if an IP address is valid IPv6
     * @param ip - The IP address to check
     * @returns True if valid IPv6
     */
    private isValidIPv6(ip: string): boolean {
        // Simplified IPv6 validation
        // Full validation would be more complex
        const ipv6Regex =
            /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
        return ipv6Regex.test(ip)
    }

    /**
     * Check if an IPv4 address is private
     * @param ip - The IPv4 address
     * @returns True if private
     */
    private isPrivateIPv4(ip: string): boolean {
        const parts = ip.split(".").map(Number)
        if (parts.length !== 4) return false

        // Check private ranges
        for (const range of IPValidationService.IPV4_PRIVATE_RANGES) {
            const startParts = range.start.split(".").map(Number)
            const endParts = range.end.split(".").map(Number)

            let isInRange = true
            for (let i = 0; i < 4; i++) {
                if (parts[i] < startParts[i] || parts[i] > endParts[i]) {
                    isInRange = false
                    break
                }
                if (parts[i] > startParts[i]) break
            }

            if (isInRange) return true
        }

        return false
    }

    /**
     * Check if an IPv4 address is loopback
     * @param ip - The IPv4 address
     * @returns True if loopback
     */
    private isLoopbackIPv4(ip: string): boolean {
        const parts = ip.split(".").map(Number)
        return parts.length === 4 && parts[0] === 127
    }

    /**
     * Check if an IPv4 address is multicast
     * @param ip - The IPv4 address
     * @returns True if multicast
     */
    private isMulticastIPv4(ip: string): boolean {
        const parts = ip.split(".").map(Number)
        if (parts.length !== 4) return false

        const startParts =
            IPValidationService.IPV4_MULTICAST_START.split(".").map(Number)
        const endParts =
            IPValidationService.IPV4_MULTICAST_END.split(".").map(Number)

        return (
            parts[0] >= startParts[0] &&
            parts[0] <= endParts[0] &&
            (parts[0] > startParts[0] ||
                (parts[1] >= startParts[1] &&
                    (parts[1] > startParts[1] ||
                        (parts[2] >= startParts[2] &&
                            (parts[2] > startParts[2] ||
                                parts[3] >= startParts[3])))))
        )
    }

    /**
     * Check if an IPv6 address is private
     * @param ip - The IPv6 address
     * @returns True if private
     */
    private isPrivateIPv6(ip: string): boolean {
        // IPv6 private ranges: fc00::/7, fe80::/10
        return /^(fc|fd)[0-9a-f]{2}:/i.test(ip) || /^fe80:/i.test(ip)
    }

    /**
     * Check if an IPv6 address is loopback
     * @param ip - The IPv6 address
     * @returns True if loopback
     */
    private isLoopbackIPv6(ip: string): boolean {
        return ip === "::1"
    }

    /**
     * Check if an IPv6 address is multicast
     * @param ip - The IPv6 address
     * @returns True if multicast
     */
    private isMulticastIPv6(ip: string): boolean {
        return /^ff[0-9a-f]{2}:/i.test(ip)
    }

    /**
     * Compare two IP addresses
     * @param ip1 - First IP address
     * @param ip2 - Second IP address
     * @returns True if IPs are the same
     */
    compareIPs(ip1: string, ip2: string): boolean {
        return ip1.trim().toLowerCase() === ip2.trim().toLowerCase()
    }
}

/**
 * Create a singleton instance of IPValidationService
 */
let ipValidationServiceInstance: IPValidationService | null = null

/**
 * Get or create the IP validation service instance
 * @returns The IP validation service instance
 */
export function getIPValidationService(): IPValidationService {
    if (!ipValidationServiceInstance) {
        ipValidationServiceInstance = new IPValidationService()
    }
    return ipValidationServiceInstance
}
