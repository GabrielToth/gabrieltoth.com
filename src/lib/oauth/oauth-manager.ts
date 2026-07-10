/**
 * OAuth Manager — Barrel Re-export
 * Re-exports all types, the OAuthManager class, and singleton helpers
 * from the split modules for backward compatibility.
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

export { OAuthManager, getOAuthManager, resetOAuthManager } from "./oauth-manager-core"
export type {
    AuthorizationUrlResponse,
    OAuthConfig,
    OAuthPlatform,
    OAuthStatus,
    OAuthTokenResponse,
} from "./oauth-types"
