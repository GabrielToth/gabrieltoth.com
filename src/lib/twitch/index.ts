/**
 * Twitch Module — Barrel Export
 * Re-exports Twitch config and OAuth service for convenient imports.
 */

export {
    createTwitchConfig,
    getTwitchConfig,
    resetTwitchConfig,
    validateTwitchConfig,
} from "./config"
export type { TwitchConfig, TwitchOAuthConfig } from "./config"

export {
    TwitchOAuthService,
    getTwitchOAuthService,
    resetTwitchOAuthService,
} from "./oauth-service"
export type {
    TwitchUser,
    TwitchChannel,
    TwitchStream,
    TwitchStreamKey,
    AuthorizationUrlResponse,
    OAuthTokenResponse,
} from "./oauth-service"
