/**
 * Session Management Module — Barrel Re-export
 *
 * Re-exports all session-related functions from their focused sub-modules.
 * All 23+ existing importers continue to work via this barrel.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

export {
    createSession,
    validateSession,
    removeSession,
    getSessionFromCookie,
    setAuthSessionCookie,
    SESSION_EXPIRATION_DAYS,
    SESSION_ID_LENGTH,
    TOKEN_LENGTH,
    SESSION_COOKIE_OPTIONS,
} from "./session-core"

export {
    generateSessionToken,
    generateRememberMeToken,
    validateSessionToken,
    validateRememberMeToken,
    refreshSessionToken,
    storeSessionToken,
    SESSION_TOKEN_EXPIRATION_HOURS,
} from "./session-tokens"

export {
    createRememberMeToken,
    getRememberMeToken,
    deleteRememberMeToken,
    storeRememberMeToken,
    REMEMBER_ME_COOKIE_OPTIONS,
    REMEMBER_ME_TOKEN_EXPIRATION_DAYS,
} from "./session-remember-me"
