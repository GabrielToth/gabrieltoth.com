/**
 * Password Security Module Index
 */

export {
    ARGON2_CONSTRAINTS,
    ConfigurationManager,
    RATE_LIMITING_DEFAULTS,
    getSecurityConfig,
} from "./config"

export {
    generateSalt,
    generateSaltHex,
    getSaltConfig,
    validateSalt,
    verifySaltEntropy,
} from "./salt-generator"

export {
    ARGON2_CONFIG,
    getArgon2Config,
    hashPasswordArgon2id,
    isArgon2idHash,
    verifyPasswordArgon2id,
} from "./argon2id-hasher"

export {
    detectHashAlgorithm,
    getAlgorithmDescription,
    isArgon2idHashFormat,
} from "./hash-algorithm-detection"

export {
    getGenericHashValidationError,
    isValidHashFormat,
    validateHashFormat,
} from "./hash-format-validator"

export { RateLimiter, getRateLimiter } from "./rate-limiter"

export {
    assertPasswordInputValid,
    validatePasswordInput,
} from "./password-input-validation"

export {
    CONSTANT_TIME_CONFIG,
    constantTimeStringCompare,
    createTimingSafeValidator,
    getConstantTimeConfig,
    normalizeResponseTime,
    performConstantTimeComparison,
} from "./constant-time-comparison"

export {
    getValidationDescription,
    isPasswordValid,
    validatePassword,
} from "./password-validator"

export type {
    Argon2Params,
    ConfigurationLoadResult,
    HashResult,
    RateLimitingConfig,
    SecurityConfig,
    ValidationError,
} from "./types"

export type { HashAlgorithmDetectionResult } from "./hash-algorithm-detection"

export type { HashFormatValidationResult } from "./hash-format-validator"

export type { RateLimitCheckResult } from "./rate-limiter"

export type { PasswordValidationResult as PasswordInputValidationResult } from "./password-input-validation"

export type { PasswordValidationResult } from "./password-validator"

export type {
    ConstantTimeComparisonResult,
    ValidationTimingMetrics,
} from "./constant-time-comparison"

export {
    AuthenticationService,
    getAuthenticationService,
} from "./authentication-service"

export type {
    AuthenticationResult,
    LoginRequest,
    RegistrationRequest,
} from "./authentication-service"

export { RegistrationService } from "./registration-service"

export { LoginService } from "./login-service"

export type {
    IAuthAuditService,
    IAuthRepository,
    IRateLimiter,
    ISecurityConfig,
} from "./auth-service-types"

export {
    getConfigurationSummary,
    logConfigurationOnStartup,
    verifyConfiguration,
} from "./configuration-logging"

export type { ConfigurationLogEntry } from "./configuration-logging"
