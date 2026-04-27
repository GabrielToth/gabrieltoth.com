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
