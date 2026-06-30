/**
 * Authentication Service: Thin Facade
 * Purpose: Orchestrate registration and login via delegated services.
 * Maintains backward-compatible API (getAuthenticationService()).
 *
 * Requirements covered:
 * - Requirement 1: Argon2id Password Hashing
 * - Requirement 3: Pepper Security Layer
 * - Requirement 6: Password Hash Validation
 * - Requirement 7: Brute Force Protection with Rate Limiting
 * - Requirement 8: Input Validation
 * - Requirement 9: Security Against Attack Vectors
 * - Requirement 10: Constant-Time Comparison
 * - Requirement 14: Error Handling and Logging
 * - Requirement 20: CAPTCHA Protection Against Automated Attacks
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { IAuthAuditService, IAuthRepository, IRateLimiter, ISecurityConfig } from "./auth-service-types"
import { getRateLimiter, getSecurityConfig, RateLimiter } from "./index"
import { LoginService } from "./login-service"
import { RegistrationService } from "./registration-service"

/**
 * Authentication result from login/registration
 */
export interface AuthenticationResult {
    success: boolean
    userId?: string
    email?: string
    error?: string
    errorCode?: string
    statusCode: number
    isLocked?: boolean
    unlockTimeSeconds?: number
    degradedMode?: boolean
}

/**
 * Registration request data
 */
export interface RegistrationRequest {
    email: string
    password: string
    captchaToken?: string
}

/**
 * Login request data
 */
export interface LoginRequest {
    email: string
    password: string
    captchaToken?: string
}

/**
 * Concrete implementations for DI interfaces using Supabase
 */

class SupabaseAuthRepository implements IAuthRepository {
    constructor(private readonly supabase: SupabaseClient) {}

    async userExistsByEmail(email: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from("users")
            .select("id")
            .eq("email", email.toLowerCase())
            .single()

        // PGRST116 = no rows found
        if (error && error.code !== "PGRST116") {
            throw error
        }

        return data !== null
    }

    async createUser(data: {
        email: string
        passwordHash: string
        passwordAlgorithm: string
    }): Promise<{ id: string; email: string }> {
        const { data: result, error } = await this.supabase
            .from("users")
            .insert({
                email: data.email.toLowerCase(),
                password_hash: data.passwordHash,
                password_algorithm: data.passwordAlgorithm,
                email_verified: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select("id, email")
            .single()

        if (error) {
            throw error
        }

        return result
    }

    async findUserByEmail(
        email: string
    ): Promise<{
        id: string
        email: string
        password_hash: string
        password_algorithm: string
    } | null> {
        const { data, error } = await this.supabase
            .from("users")
            .select("id, email, password_hash, password_algorithm")
            .eq("email", email.toLowerCase())
            .single()

        if (error && error.code !== "PGRST116") {
            throw error
        }

        return data
    }
}

class SupabaseAuthAuditService implements IAuthAuditService {
    constructor(private readonly supabase: SupabaseClient) {}

    async logRegistration(data: {
        email: string
        userId: string
        algorithm: string
        hashTimeTakenMs: number
    }): Promise<void> {
        const { error } = await this.supabase.from("audit_logs").insert({
            event_type: "user_registered",
            email: data.email,
            user_id: data.userId,
            timestamp: new Date().toISOString(),
            details: {
                algorithm: data.algorithm,
                hashTimeTakenMs: data.hashTimeTakenMs,
            },
        })

        if (error) {
            throw error
        }
    }

    async logAuthSuccess(data: {
        email: string
        userId: string
        algorithm: string
        degradedMode: boolean
    }): Promise<void> {
        const { error } = await this.supabase.from("audit_logs").insert({
            event_type: "auth_success",
            email: data.email,
            user_id: data.userId,
            timestamp: new Date().toISOString(),
            details: {
                algorithm: data.algorithm,
                degradedMode: data.degradedMode,
            },
        })

        if (error) {
            throw error
        }
    }

    async logRateLimitExceeded(data: {
        email: string
        degradedMode: boolean
    }): Promise<void> {
        const { error } = await this.supabase.from("audit_logs").insert({
            event_type: "rate_limit_exceeded",
            email: data.email,
            timestamp: new Date().toISOString(),
            details: {
                degradedMode: data.degradedMode,
            },
        })

        if (error) {
            throw error
        }
    }
}

class RateLimiterAdapter implements IRateLimiter {
    constructor(private readonly rateLimiter: RateLimiter) {}

    async checkAndUpdateRateLimit(
        identifier: string
    ): Promise<{ allowed: boolean; isLocked: boolean; lockedUntil?: Date }> {
        const result = await this.rateLimiter.checkAndUpdateRateLimit(identifier)
        return {
            allowed: result.allowed,
            isLocked: result.isLocked,
            lockedUntil: result.lockedUntil,
        }
    }

    async recordFailure(identifier: string): Promise<void> {
        await this.rateLimiter.recordFailure(identifier)
    }

    async recordSuccess(identifier: string): Promise<void> {
        await this.rateLimiter.recordSuccess(identifier)
    }
}

class SecurityConfigAdapter implements ISecurityConfig {
    get rateLimiting() {
        const config = getSecurityConfig()
        return {
            maxAttempts: config.rateLimiting.failureThreshold,
            windowMs: config.rateLimiting.windowMinutes * 60 * 1000,
            lockoutDurationMs: config.rateLimiting.lockoutMinutes * 60 * 1000,
        }
    }
}

/**
 * Authentication Service (Thin Facade)
 *
 * Maintains backward-compatible API while delegating to
 * RegistrationService and LoginService.
 */
export class AuthenticationService {
    private registrationService: RegistrationService
    private loginService: LoginService
    private rateLimiterInstance: RateLimiter

    constructor(supabase?: SupabaseClient) {
        const client =
            supabase ??
            createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                    },
                }
            )

        const config = getSecurityConfig()
        this.rateLimiterInstance = getRateLimiter(config.rateLimiting)

        const authRepository = new SupabaseAuthRepository(client)
        const authAuditService = new SupabaseAuthAuditService(client)
        const rateLimiterAdapter = new RateLimiterAdapter(
            this.rateLimiterInstance
        )
        const securityConfig = new SecurityConfigAdapter()

        this.registrationService = new RegistrationService(
            authRepository,
            authAuditService,
            rateLimiterAdapter,
            securityConfig
        )
        this.loginService = new LoginService(
            authRepository,
            authAuditService,
            rateLimiterAdapter
        )
    }

    async register(
        request: RegistrationRequest
    ): Promise<AuthenticationResult> {
        return this.registrationService.register(request)
    }

    async login(request: LoginRequest): Promise<AuthenticationResult> {
        return this.loginService.login(request)
    }

    getRateLimiter(): RateLimiter {
        return this.rateLimiterInstance
    }

    getSecurityConfig() {
        return getSecurityConfig()
    }
}

/**
 * Singleton instance of Authentication Service
 */
let authServiceInstance: AuthenticationService | null = null

/**
 * Get or create Authentication Service instance
 */
export function getAuthenticationService(): AuthenticationService {
    if (!authServiceInstance) {
        authServiceInstance = new AuthenticationService()
    }
    return authServiceInstance
}
