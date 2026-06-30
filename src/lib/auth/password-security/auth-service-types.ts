/**
 * Auth Service Types: Dependency Injection Interfaces
 * Purpose: Define interfaces for constructor injection into RegistrationService and LoginService
 *
 * These interfaces enable:
 * - Dependency injection for testability
 * - Decoupling from direct Supabase calls
 * - Clear contracts between service layers
 */

/**
 * Repository interface for user data operations
 */
export interface IAuthRepository {
    /** Check if a user exists by email */
    userExistsByEmail(email: string): Promise<boolean>

    /** Create a new user record */
    createUser(data: {
        email: string
        passwordHash: string
        passwordAlgorithm: string
    }): Promise<{ id: string; email: string }>

    /** Find a user by email with password hash */
    findUserByEmail(
        email: string
    ): Promise<{
        id: string
        email: string
        password_hash: string
        password_algorithm: string
    } | null>
}

/**
 * Audit service interface for logging auth events
 */
export interface IAuthAuditService {
    /** Log a registration event */
    logRegistration(data: {
        email: string
        userId: string
        algorithm: string
        hashTimeTakenMs: number
    }): Promise<void>

    /** Log a successful authentication */
    logAuthSuccess(data: {
        email: string
        userId: string
        algorithm: string
        degradedMode: boolean
    }): Promise<void>

    /** Log a rate limit exceeded event */
    logRateLimitExceeded(data: {
        email: string
        degradedMode: boolean
    }): Promise<void>
}

/**
 * Rate limiter interface for brute-force protection
 */
export interface IRateLimiter {
    /** Check if the request is allowed based on rate limits */
    checkAndUpdateRateLimit(
        identifier: string
    ): Promise<{
        allowed: boolean
        isLocked: boolean
        lockedUntil?: Date
    }>

    /** Record a failed attempt */
    recordFailure(identifier: string): Promise<void>

    /** Record a successful attempt (resets counter) */
    recordSuccess(identifier: string): Promise<void>
}

/**
 * Security configuration interface
 */
export interface ISecurityConfig {
    rateLimiting: {
        maxAttempts: number
        windowMs: number
        lockoutDurationMs: number
    }
}
