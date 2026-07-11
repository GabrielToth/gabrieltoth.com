/**
 * Twitter/X Module
 * Exports configuration, OAuth 1.0a service, and token management
 *
 * NOTE: OAuth 2.0 PKCE is not available for apps created in the new
 * X Developer Console. OAuth 1.0a (3-legged) is used for auth and
 * HMAC-SHA1 signed requests for API calls.
 */

export {
    getTwitterConfig,
    resetTwitterConfig,
    validateTwitterConfig,
    createTwitterConfig,
    type TwitterConfig,
    type TwitterOAuthConfig,
} from "./config"

export {
    TwitterOAuthService,
    getTwitterOAuthService,
    resetTwitterOAuthService,
    type AuthorizationUrlResponse,
    type OAuthTokenResponse,
    type TwitterUser,
} from "./oauth-service"

export { TwitterOAuth1Service } from "./oauth1-service"

export { getValidTwitterToken } from "./get-valid-token"
