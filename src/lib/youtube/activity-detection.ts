/**
 * Activity Detection Service
 * Combines geolocation, device detection, and IP validation for suspicious activity detection
 * Validates: Requirements 5.1, 5.2
 */

import { IncomingMessage } from "http"
import { createLogger } from "../logger"
import { DeviceDetectionService, DeviceInfo } from "./device-detection"
import { GeolocationInfo, GeolocationService } from "./geolocation"
import { IPInfo, IPValidationService } from "./ip-validation"

/**
 * Activity information collected from a request
 */
export interface ActivityInfo {
    /**
     * IP address
     */
    ip: string

    /**
     * IP information
     */
    ipInfo: IPInfo

    /**
     * Device information
     */
    device: DeviceInfo

    /**
     * Geolocation information
     */
    location: GeolocationInfo

    /**
     * Timestamp when activity was recorded
     */
    timestamp: Date

    /**
     * User agent string
     */
    userAgent: string
}

/**
 * Suspicious activity detection result
 */
export interface SuspiciousActivityResult {
    /**
     * Whether the activity is suspicious
     */
    isSuspicious: boolean

    /**
     * Reasons for suspicion (if any)
     */
    reasons: string[]

    /**
     * Confidence score (0-100)
     */
    confidenceScore: number

    /**
     * Detailed comparison results
     */
    comparison: {
        ipChanged: boolean
        countryChanged: boolean
        cityChanged: boolean
        deviceTypeChanged: boolean
        osChanged: boolean
        browserChanged: boolean
        distanceKm: number
    }
}

/**
 * Activity Detection Service
 * Detects suspicious activity by comparing current activity with previous activity
 */
export class ActivityDetectionService {
    private logger = createLogger("ActivityDetectionService")
    private deviceDetectionService: DeviceDetectionService
    private ipValidationService: IPValidationService
    private geolocationService: GeolocationService

    /**
     * Threshold for suspicious activity detection
     * Activity is considered suspicious if confidence score exceeds this threshold
     */
    private readonly SUSPICIOUS_THRESHOLD = 50

    /**
     * Initialize the activity detection service
     * @param deviceDetectionService - Device detection service
     * @param ipValidationService - IP validation service
     * @param geolocationService - Geolocation service
     */
    constructor(
        deviceDetectionService: DeviceDetectionService,
        ipValidationService: IPValidationService,
        geolocationService: GeolocationService
    ) {
        this.deviceDetectionService = deviceDetectionService
        this.ipValidationService = ipValidationService
        this.geolocationService = geolocationService
    }

    /**
     * Collect activity information from a request
     * @param request - The HTTP request
     * @returns Activity information
     * @throws Error if activity collection fails
     *
     * @example
     * const service = new ActivityDetectionService(...)
     * const activity = await service.collectActivity(req)
     * // Returns: { ip: '203.0.113.42', device: {...}, location: {...}, ... }
     */
    async collectActivity(request: IncomingMessage): Promise<ActivityInfo> {
        try {
            // Extract IP address
            const ip = this.ipValidationService.extractIPFromRequest(request)
            const ipInfo = this.ipValidationService.validateIP(ip)

            // Extract device information
            const userAgent = request.headers["user-agent"] || ""
            const device = this.deviceDetectionService.detectDevice(userAgent)

            // Get geolocation information
            let location: GeolocationInfo
            try {
                location = await this.geolocationService.getLocation(ip)
            } catch (error) {
                this.logger.warn(
                    `Failed to get geolocation for ${ip}`,
                    error instanceof Error ? error : new Error(String(error))
                )
                // Return default location if geolocation fails
                location = this.getDefaultLocation()
            }

            return {
                ip,
                ipInfo,
                device,
                location,
                timestamp: new Date(),
                userAgent,
            }
        } catch (error) {
            this.logger.error(
                "Failed to collect activity information",
                error instanceof Error ? error : new Error(String(error))
            )
            throw error
        }
    }

    /**
     * Detect suspicious activity by comparing current activity with previous activity
     * @param previousActivity - Previous activity information
     * @param currentActivity - Current activity information
     * @returns Suspicious activity detection result
     *
     * @example
     * const result = service.detectSuspiciousActivity(previousActivity, currentActivity)
     * // Returns: { isSuspicious: true, reasons: ['IP changed', 'Country changed'], confidenceScore: 75 }
     */
    detectSuspiciousActivity(
        previousActivity: ActivityInfo,
        currentActivity: ActivityInfo
    ): SuspiciousActivityResult {
        const reasons: string[] = []
        let confidenceScore = 0

        // Compare IP addresses
        const ipChanged = !this.ipValidationService.compareIPs(
            previousActivity.ip,
            currentActivity.ip
        )
        if (ipChanged) {
            reasons.push("IP address changed")
            confidenceScore += 20
        }

        // Compare geolocation
        const locationComparison = this.geolocationService.compareLocations(
            previousActivity.location,
            currentActivity.location
        )

        if (locationComparison.countryChanged) {
            reasons.push("Country changed")
            confidenceScore += 25
        }

        if (
            locationComparison.cityChanged &&
            !locationComparison.countryChanged
        ) {
            reasons.push("City changed")
            confidenceScore += 10
        }

        // Check for impossible travel (too far too fast)
        const timeDiffMinutes =
            (currentActivity.timestamp.getTime() -
                previousActivity.timestamp.getTime()) /
            (1000 * 60)
        const maxPossibleDistance = timeDiffMinutes * 15 // Assume max 15 km/min (900 km/h)

        if (
            locationComparison.distanceKm > maxPossibleDistance &&
            timeDiffMinutes < 60
        ) {
            reasons.push(
                `Impossible travel detected: ${locationComparison.distanceKm.toFixed(0)}km in ${timeDiffMinutes.toFixed(0)} minutes`
            )
            confidenceScore += 30
        }

        // Compare device information
        const deviceComparison = this.deviceDetectionService.compareDevices(
            previousActivity.device,
            currentActivity.device
        )

        if (deviceComparison.deviceTypeChanged) {
            reasons.push("Device type changed")
            confidenceScore += 15
        }

        if (deviceComparison.osChanged) {
            reasons.push("Operating system changed")
            confidenceScore += 10
        }

        if (deviceComparison.browserChanged) {
            reasons.push("Browser changed")
            confidenceScore += 5
        }

        // Normalize confidence score to 0-100
        confidenceScore = Math.min(100, confidenceScore)

        return {
            isSuspicious: confidenceScore >= this.SUSPICIOUS_THRESHOLD,
            reasons,
            confidenceScore,
            comparison: {
                ipChanged,
                countryChanged: locationComparison.countryChanged,
                cityChanged: locationComparison.cityChanged,
                deviceTypeChanged: deviceComparison.deviceTypeChanged,
                osChanged: deviceComparison.osChanged,
                browserChanged: deviceComparison.browserChanged,
                distanceKm: locationComparison.distanceKm,
            },
        }
    }

    /**
     * Get default location (used when geolocation fails)
     * @returns Default geolocation information
     */
    private getDefaultLocation(): GeolocationInfo {
        return {
            country: "Unknown",
            countryName: "Unknown",
            city: "Unknown",
            state: "Unknown",
            latitude: 0,
            longitude: 0,
            timezone: "Unknown",
            isp: "Unknown",
            isAccurate: false,
            accuracyRadius: 0,
        }
    }

    /**
     * Set the suspicious activity threshold
     * @param threshold - Confidence score threshold (0-100)
     */
    setSuspiciousThreshold(threshold: number): void {
        if (threshold < 0 || threshold > 100) {
            throw new Error("Threshold must be between 0 and 100")
        }
        ;(this as any).SUSPICIOUS_THRESHOLD = threshold
    }
}

/**
 * Create a singleton instance of ActivityDetectionService
 */
let activityDetectionServiceInstance: ActivityDetectionService | null = null

/**
 * Get or create the activity detection service instance
 * @param deviceDetectionService - Device detection service
 * @param ipValidationService - IP validation service
 * @param geolocationService - Geolocation service
 * @returns The activity detection service instance
 */
export function getActivityDetectionService(
    deviceDetectionService: DeviceDetectionService,
    ipValidationService: IPValidationService,
    geolocationService: GeolocationService
): ActivityDetectionService {
    if (!activityDetectionServiceInstance) {
        activityDetectionServiceInstance = new ActivityDetectionService(
            deviceDetectionService,
            ipValidationService,
            geolocationService
        )
    }
    return activityDetectionServiceInstance
}

/**
 * Reset the activity detection service (useful for testing)
 */
export function resetActivityDetectionService(): void {
    activityDetectionServiceInstance = null
}
