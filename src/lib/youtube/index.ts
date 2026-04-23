/**
 * YouTube Integration Module
 * Exports all YouTube-related services and utilities
 * Validates: Requirements 1.1
 */

// Base Service Infrastructure
export {
    BaseService,
    ServiceError,
    ServiceRegistry,
    getServiceRegistry,
    type ServiceLifecycle,
} from "./base-service"

// Dependency Injection
export {
    DIContainer,
    getDIContainer,
    resetDIContainer,
    type ServiceFactory,
} from "./dependency-injection"

// Configuration
export {
    createYouTubeChannelLinkingConfig,
    getYouTubeChannelLinkingConfig,
    resetYouTubeChannelLinkingConfig,
    validateYouTubeChannelLinkingConfig,
    type EmailServiceConfig,
    type GeolocationServiceConfig,
    type TokenEncryptionConfig,
    type YouTubeChannelLinkingConfig,
    type YouTubeOAuthConfig,
} from "./config"

// Token Encryption
export {
    TokenEncryptionService,
    generateEncryptionKey,
    getTokenEncryptionService,
    validateEncryptionKey,
    type DecryptionResult,
    type EncryptionResult,
    type KeyManagementStrategy,
} from "./token-encryption"

// OAuth Service
export {
    YouTubeOAuthService,
    getYouTubeOAuthService,
    resetYouTubeOAuthService,
    type AuthorizationUrlResponse,
    type OAuthTokenResponse,
} from "./oauth-service"

// Channel Validation
export {
    ChannelValidationService,
    getChannelValidationService,
    resetChannelValidationService,
    type ChannelValidationResult,
    type OAuthResponse,
    type YouTubeChannelInfo,
} from "./channel-validation"

// Device Detection
export {
    DeviceDetectionService,
    getDeviceDetectionService,
    type DeviceInfo,
    type DeviceType,
} from "./device-detection"

// IP Validation
export {
    IPValidationService,
    getIPValidationService,
    type IPInfo,
} from "./ip-validation"

// Geolocation
export {
    GeolocationService,
    getGeolocationService,
    resetGeolocationService,
    type GeolocationInfo,
    type GeolocationServiceConfig,
} from "./geolocation"

// Activity Detection
export {
    ActivityDetectionService,
    getActivityDetectionService,
    resetActivityDetectionService,
    type ActivityInfo,
    type SuspiciousActivityResult,
} from "./activity-detection"
