            // 4. Constant-time comparison
            authResult = await authService.login({
                email: email.toLowerCase(),
                password,
                captchaToken: captchaToken as string,
            })
        } catch (error) {
            // Log password validation error
            logAuthError(
                AuthErrorType.INTERNAL_ERROR,
                email,
                clientIp,
                `Password validation error (requestId: ${requestId}): ${error instanceof Error ? error.message : "Unknown error"}`
            )

            // Increment rate limit counter by email (Requirement 7.1: track by email)
            await incrementAttemptWithDegradation(email, degradedMode)

            return createErrorResponse(AuthErrorType.INTERNAL_ERROR)
        }

        // Check if authentication was successful
        if (!authResult.success) {
            // Log failed login attempt 
            await logLoginFailure(
                email,
                clientIp,
                authResult.error || "Invalid credentials"
            )

            // Increment rate limit counter by email (Requirement 7.1: track by email)
            await incrementAttemptWithDegradation(email, degradedMode)

            // Return generic error for security
            // Requirement 7.4: Generic error messages (no user enumeration)
            return createErrorResponse(AuthErrorType.INVALID_CREDENTIALS)
        }

        // Authentication successful
        const userId = authResult.userId

        // ============================================================================
        // SESSION TOKEN CREATION 
        // ============================================================================

        // Generate cryptographically secure session token
        const sessionToken = Buffer.from(
            `${userId}:${Date.now()}:${Math.random()}`
        ).toString("base64")

        // Calculate expiration time (1 hour for session, 30 days for remember me)
        const sessionExpirationTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        const rememberMeExpirationTime = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        ) // 30 days

        // ============================================================================
        // SESSION STORAGE 
        // ============================================================================

        try {
            // Store session in database
            const { error: sessionError } = await supabase
                .from("sessions")
                .insert({
                    user_id: userId,
                    token_hash: sessionToken, // In production, hash this
                    expires_at: sessionExpirationTime.toISOString(),
                    ip_address: clientIp,
                    user_agent: userAgent,
                })

            if (sessionError) {
                logAuthError(
                    AuthErrorType.DATABASE_ERROR,
                    email,
                    clientIp,
                    `Session creation error (requestId: ${requestId}): ${sessionError.message}`
                )

                // Increment rate limit counter (with degraded mode support)
                await incrementAttemptWithDegradation(clientIp, degradedMode)

                return createErrorResponse(AuthErrorType.DATABASE_ERROR)
            }
        } catch (error) {
            logAuthError(
                AuthErrorType.DATABASE_ERROR,
                email,
                clientIp,
                `Session storage error (requestId: ${requestId}): ${error instanceof Error ? error.message : "Unknown error"}`
            )

            // Increment rate limit counter (with degraded mode support)
            await incrementAttemptWithDegradation(clientIp, degradedMode)

            return createErrorResponse(AuthErrorType.DATABASE_ERROR)
        }

        // ============================================================================
        // REMEMBER ME TOKEN CREATION 
        // ============================================================================

        if (rememberMe) {
            try {
                const rememberMeToken = Buffer.from(
                    `${userId}:${Date.now()}:${Math.random()}`
                ).toString("base64")

                // Store remember me token in database
                const { error: rememberMeError } = await supabase
                    .from("remember_me_tokens")
                    .insert({
                        user_id: userId,
                        token_hash: rememberMeToken, // In production, hash this
                        expires_at: rememberMeExpirationTime.toISOString(),
                        ip_address: clientIp,
                        user_agent: userAgent,
                    })

                if (rememberMeError) {
                    logAuthError(
                        AuthErrorType.DATABASE_ERROR,
                        email,
                        clientIp,
                        `Remember Me token creation error (requestId: ${requestId}): ${rememberMeError.message}`
                    )
                    // Don't fail the login if remember me fails
                }
            } catch (error) {
                logAuthError(
                    AuthErrorType.DATABASE_ERROR,
                    email,
                    clientIp,
                    `Remember Me token storage error (requestId: ${requestId}): ${error instanceof Error ? error.message : "Unknown error"}`
                )
                // Don't fail the login if remember me fails
            }
        }

        // ============================================================================
        // RESPONSE CREATION 
        // ============================================================================

        // Create success response
        const response = createSuccessResponse(
            {
                userId: userId,
                email: email,
                sessionToken,
            },
            "Login successful"
        )

        // ============================================================================
        // Secure cookie settings
        // ============================================================================

        // Set secure session cookie (HttpOnly, Secure, SameSite)
        response.cookies.set({
            name: "auth_session",
            value: sessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60, // 1 hour
            path: "/",
        })

        // Set remember me cookie if requested
        if (rememberMe) {
            const rememberMeToken = Buffer.from(
                `${userId}:${Date.now()}:${Math.random()}`
            ).toString("base64")

            response.cookies.set({
                name: "remember_me_token",
                value: rememberMeToken,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60, // 30 days
                path: "/",
            })
        }

        // ============================================================================
        // AUDIT LOGGING 
        // ============================================================================

        // Log successful login 
        await logLoginSuccess(email, clientIp, userId)

        void notifyUserAuditDiscord("user_login", {
            email,
            userId,
            provider: "email",
            ip: clientIp,
            environment: getAuditEnvironment(),
        })

        // Reset rate limit counter on successful login (Requirement 7.5)
        // Track by email (Requirement 7.1)
        await resetAttempt(email)

        return response
    } catch (error) {
        // ============================================================================
        // ERROR HANDLING 
        // ============================================================================

        logAuthError(
            AuthErrorType.INTERNAL_ERROR,
            undefined,
            "unknown",
            `Unexpected error in login endpoint (requestId: ${requestId}): ${error instanceof Error ? error.message : "Unknown error"}`
        )

        // Check if it's a network error or server error
        if (error instanceof TypeError && error.message.includes("fetch")) {
            return createErrorResponse(
                AuthErrorType.INTERNAL_ERROR,
                undefined,
                "Server is currently unavailable. Please try again later."
            )
        }

        return createErrorResponse(AuthErrorType.INTERNAL_ERROR)
    }
}
