/**
 * Password Security Module Index
 * Exports all password security components
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

export type {
    Argon2Params,
    ConfigurationLoadResult,
    RateLimitingConfig,
    SecurityConfig,
    ValidationError,
} from "./types"
