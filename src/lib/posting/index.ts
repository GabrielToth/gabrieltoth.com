/**
 * Posting Module
 * Exports services for content adaptation and conflict detection
 */

export {
    ContentAdapter,
    getContentAdapter,
    resetContentAdapter,
    type ContentValidationResult,
} from "./content-adapter"

export {
    ConflictDetector,
    getConflictDetector,
    resetConflictDetector,
    type Conflict,
    type ConflictDetectionResult,
    type ConflictType,
} from "./conflict-detector"

export { postToInstagram } from "./adapters/instagram"
export type {
    InstagramPostConfig,
    InstagramPostResult,
} from "./adapters/instagram"

export { postToTikTok } from "./adapters/tiktok"
export type { TikTokPostConfig, TikTokPostResult } from "./adapters/tiktok"

export { postToTwitter } from "./adapters/twitter"
export type { TwitterPostConfig, TwitterPostResult } from "./adapters/twitter"
