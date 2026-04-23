/**
 * Authentication System Type Definitions
 * Defines all TypeScript interfaces for the OAuth Google Authentication system
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

/**
 * User interface representing a user record in the database
 * Simplified for Google OAuth only - no password or email verification fields
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
export interface User {
    id: string
    google_id: string
    google_email: string
    google_name: string
    google_picture?: string
    created_at: Date
    updated_at: Date
}

/**
 * OAuth User interface representing a user with OAuth and password authentication
 * Supports multiple OAuth providers (Google, Facebook, TikTok) with email/password fallback
 *
 * Validates: Requirements 2.5, 3.6, 11.3, 1.1, 1.2, 1.3, 9.1
 */
export interface OAuthUser {
    /** Unique identifier for the user */
    id: string
    /** User's email address */
    email: string
    /** Hashed password for email/password authentication. Null for OAuth-only users until account completion */
    password_hash: string | null
    /** OAuth provider used for authentication (google, facebook, tiktok, or null for email/password users) */
    oauth_provider: "google" | "facebook" | "tiktok" | null
    /** OAuth provider's unique identifier for the user. Null for email/password users */
    oauth_id: string | null
    /** User's full name */
    name: string
    /** User's profile picture URL from OAuth provider */
    picture?: string | null
    /** User's phone number in international format (e.g., +1234567890). Optional field added during account completion */
    phone_number?: string | null
    /** User's birth date in ISO 8601 format (YYYY-MM-DD). Optional field added during account completion */
    birth_date?: Date | null
    /** Account completion status: 'pending' (incomplete), 'in_progress' (started), 'completed' (finished) */
    account_completion_status: "pending" | "in_progress" | "completed"
    /** Timestamp when the user completed their account setup. Null until account completion is finished */
    account_completed_at?: Date | null
    /** Whether the user's email has been verified */
    email_verified: boolean
    /** Timestamp when the user record was created */
    created_at: Date
    /** Timestamp when the user record was last updated */
    updated_at: Date
}

/**
 * Session interface representing an authenticated user session
 * Stores session information with expiration tracking
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */
export interface Session {
    id: string
    user_id: string
    session_id: string
    created_at: Date
    expires_at: Date
}

/**
 * Audit Log interface for security audit trail
 * Records all authentication events for security monitoring
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4
 */
export interface AuditLog {
    id: string
    user_id?: string
    event_type: "login" | "logout" | "login_failed" | "user_created"
    timestamp: Date
    ip_address?: string
    user_agent?: string
}

/**
 * Generic API Response interface for all API endpoints
 * Provides a consistent response format across all endpoints
 */
export interface ApiResponse<T = unknown> {
    success: boolean
    message?: string
    error?: string
    data?: T
    field?: string
}

/**
 * Google OAuth Token Payload
 * Represents the decoded JWT token from Google
 */
export interface GoogleTokenPayload {
    sub: string // google_id
    email: string
    name: string
    picture?: string
    aud: string
    iss: string
    exp: number
    iat: number
}

/**
 * Google User Data
 * Extracted user information from Google OAuth token
 */
export interface GoogleUserData {
    google_id: string
    google_email: string
    google_name: string
    google_picture?: string
}

/**
 * Google OAuth Callback Request
 * Request body for the OAuth callback endpoint
 */
export interface GoogleCallbackRequest {
    code: string
}

/**
 * Google OAuth Callback Response
 * Response from the OAuth callback endpoint
 */
export interface GoogleCallbackResponse {
    redirectUrl: string
    userId: string
}
