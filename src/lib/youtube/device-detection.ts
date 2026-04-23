/**
 * Device Detection Service
 * Detects device type and characteristics from user agent strings
 * Validates: Requirements 5.1, 5.2
 */

/**
 * Supported device types
 */
export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown"

/**
 * Device information extracted from user agent
 */
export interface DeviceInfo {
    /**
     * Type of device (mobile, tablet, desktop, unknown)
     */
    type: DeviceType

    /**
     * Operating system (iOS, Android, Windows, macOS, Linux, etc.)
     */
    os: string

    /**
     * Browser name (Chrome, Firefox, Safari, Edge, etc.)
     */
    browser: string

    /**
     * Browser version
     */
    browserVersion: string

    /**
     * Raw user agent string
     */
    userAgent: string

    /**
     * Whether the device is a mobile device
     */
    isMobile: boolean

    /**
     * Whether the device is a tablet
     */
    isTablet: boolean

    /**
     * Whether the device is a desktop
     */
    isDesktop: boolean
}

/**
 * Device Detection Service
 * Parses user agent strings to extract device information
 */
export class DeviceDetectionService {
    /**
     * Mobile device patterns
     */
    private static readonly MOBILE_PATTERNS = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i,
        /Opera Mini/i,
        /IEMobile/i,
        /Mobile/i,
        /mobile/i,
    ]

    /**
     * Tablet device patterns
     */
    private static readonly TABLET_PATTERNS = [
        /iPad/i,
        /Android/i,
        /Tablet/i,
        /tablet/i,
        /Kindle/i,
        /Playbook/i,
        /Nexus 7/i,
        /Nexus 10/i,
        /Xoom/i,
    ]

    /**
     * Operating system patterns
     */
    private static readonly OS_PATTERNS: Record<string, RegExp> = {
        Windows: /Windows NT/i,
        macOS: /Mac OS X/i,
        iOS: /iPhone|iPad|iPod/i,
        Android: /Android/i,
        Linux: /Linux/i,
        ChromeOS: /CrOS/i,
        Ubuntu: /Ubuntu/i,
        Debian: /Debian/i,
        Fedora: /Fedora/i,
        "Red Hat": /Red Hat/i,
    }

    /**
     * Browser patterns
     */
    private static readonly BROWSER_PATTERNS: Record<string, RegExp> = {
        Edge: /Edg\/(\d+)/i,
        Chrome: /Chrome\/(\d+)/i,
        Firefox: /Firefox\/(\d+)/i,
        Safari: /Version\/(\d+).*Safari/i,
        Opera: /Opera\/(\d+)|OPR\/(\d+)/i,
        IE: /MSIE (\d+)|Trident.*rv:(\d+)/i,
        "Samsung Internet": /SamsungBrowser\/(\d+)/i,
    }

    /**
     * Detect device information from user agent string
     * @param userAgent - The user agent string
     * @returns Device information
     *
     * @example
     * const service = new DeviceDetectionService()
     * const info = service.detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)...')
     * // Returns: { type: 'mobile', os: 'iOS', browser: 'Safari', ... }
     */
    detectDevice(userAgent: string): DeviceInfo {
        if (!userAgent || typeof userAgent !== "string") {
            return this.createUnknownDevice(userAgent || "")
        }

        const type = this.detectDeviceType(userAgent)
        const os = this.detectOS(userAgent)
        const { browser, version } = this.detectBrowser(userAgent)

        return {
            type,
            os,
            browser,
            browserVersion: version,
            userAgent,
            isMobile: type === "mobile",
            isTablet: type === "tablet",
            isDesktop: type === "desktop",
        }
    }

    /**
     * Detect device type from user agent
     * @param userAgent - The user agent string
     * @returns Device type
     */
    private detectDeviceType(userAgent: string): DeviceType {
        // Limit user agent length to prevent performance issues
        const limitedUserAgent = userAgent.substring(0, 1000)

        // Check for tablet first (more specific)
        if (
            this.matchesPatterns(
                limitedUserAgent,
                DeviceDetectionService.TABLET_PATTERNS
            )
        ) {
            // iPad is both tablet and mobile pattern, so check specifically
            if (/iPad/i.test(limitedUserAgent)) {
                return "tablet"
            }
            // Android could be tablet or mobile, check for tablet indicators
            if (/Android/i.test(limitedUserAgent)) {
                if (
                    /tablet|Nexus 7|Nexus 10|Xoom|Kindle/i.test(
                        limitedUserAgent
                    )
                ) {
                    return "tablet"
                }
            }
        }

        // Check for mobile
        if (
            this.matchesPatterns(
                limitedUserAgent,
                DeviceDetectionService.MOBILE_PATTERNS
            )
        ) {
            return "mobile"
        }

        // Default to desktop
        return "desktop"
    }

    /**
     * Detect operating system from user agent
     * @param userAgent - The user agent string
     * @returns Operating system name
     */
    private detectOS(userAgent: string): string {
        // Check iOS first (before macOS, since iOS user agents contain "Mac OS X")
        if (/iPhone|iPad|iPod/i.test(userAgent)) {
            return "iOS"
        }

        for (const [os, pattern] of Object.entries(
            DeviceDetectionService.OS_PATTERNS
        )) {
            if (pattern.test(userAgent)) {
                return os
            }
        }

        return "Unknown"
    }

    /**
     * Detect browser from user agent
     * @param userAgent - The user agent string
     * @returns Browser name and version
     */
    private detectBrowser(userAgent: string): {
        browser: string
        version: string
    } {
        for (const [browser, pattern] of Object.entries(
            DeviceDetectionService.BROWSER_PATTERNS
        )) {
            const match = userAgent.match(pattern)
            if (match) {
                // Extract version from capture groups
                const version = match[1] || match[2] || "Unknown"
                return { browser, version }
            }
        }

        return { browser: "Unknown", version: "Unknown" }
    }

    /**
     * Check if user agent matches any of the provided patterns
     * @param userAgent - The user agent string
     * @param patterns - Array of regex patterns
     * @returns True if any pattern matches
     */
    private matchesPatterns(userAgent: string, patterns: RegExp[]): boolean {
        return patterns.some(pattern => pattern.test(userAgent))
    }

    /**
     * Create an unknown device info object
     * @param userAgent - The user agent string
     * @returns Device info with unknown values
     */
    private createUnknownDevice(userAgent: string): DeviceInfo {
        return {
            type: "unknown",
            os: "Unknown",
            browser: "Unknown",
            browserVersion: "Unknown",
            userAgent,
            isMobile: false,
            isTablet: false,
            isDesktop: false,
        }
    }

    /**
     * Compare two device infos to detect changes
     * @param previous - Previous device info
     * @param current - Current device info
     * @returns Object indicating what changed
     *
     * @example
     * const changes = service.compareDevices(previousInfo, currentInfo)
     * // Returns: { deviceTypeChanged: true, osChanged: false, browserChanged: false }
     */
    compareDevices(
        previous: DeviceInfo,
        current: DeviceInfo
    ): {
        deviceTypeChanged: boolean
        osChanged: boolean
        browserChanged: boolean
        anyChanged: boolean
    } {
        return {
            deviceTypeChanged: previous.type !== current.type,
            osChanged: previous.os !== current.os,
            browserChanged: previous.browser !== current.browser,
            anyChanged:
                previous.type !== current.type ||
                previous.os !== current.os ||
                previous.browser !== current.browser,
        }
    }
}

/**
 * Create a singleton instance of DeviceDetectionService
 */
let deviceDetectionServiceInstance: DeviceDetectionService | null = null

/**
 * Get or create the device detection service instance
 * @returns The device detection service instance
 */
export function getDeviceDetectionService(): DeviceDetectionService {
    if (!deviceDetectionServiceInstance) {
        deviceDetectionServiceInstance = new DeviceDetectionService()
    }
    return deviceDetectionServiceInstance
}
