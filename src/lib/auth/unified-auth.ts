export interface UnifiedAuthResult {
    success: boolean
    userExists: boolean
    userId?: string
    email?: string
    error?: string
}

export async function checkUserExists(
    email: string
): Promise<UnifiedAuthResult> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (!response.ok) {
            return {
                success: true,
                userExists: false,
                email,
            }
        }

        const data = await response.json()
        const userExists = Array.isArray(data) && data.length > 0

        return {
            success: true,
            userExists,
            email,
        }
    } catch {
        return {
            success: false,
            userExists: false,
            error: "Failed to check user existence",
        }
    }
}

export async function signInWithEmail(
    email: string,
    password: string
): Promise<UnifiedAuthResult> {
    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
            return {
                success: false,
                userExists: false,
                error: data.error || "Authentication failed",
            }
        }

        return {
            success: true,
            userExists: true,
            userId: data.data?.userId,
            email: data.data?.email,
        }
    } catch (err) {
        return {
            success: false,
            userExists: false,
            error: err instanceof Error ? err.message : "Authentication failed",
        }
    }
}

export async function signUpWithEmail(
    email: string,
    password: string,
    metadata?: Record<string, unknown>
): Promise<UnifiedAuthResult> {
    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password,
                name: (metadata?.name as string) || email.split("@")[0],
                phone: metadata?.phone || "",
                captchaToken: metadata?.captchaToken as string | undefined,
            }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
            return {
                success: false,
                userExists: false,
                error: data.error || "Registration failed",
            }
        }

        return {
            success: true,
            userExists: false,
            userId: data.data?.userId,
            email: data.data?.email,
        }
    } catch (err) {
        return {
            success: false,
            userExists: false,
            error: err instanceof Error ? err.message : "Registration failed",
        }
    }
}

export async function signInWithOAuth(
    provider: "google" | "github"
): Promise<void> {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI

    if (!clientId || !redirectUri) {
        throw new Error("OAuth not configured")
    }

    const state = Math.random().toString(36).substring(7)
    if (typeof window !== "undefined") {
        sessionStorage.setItem("oauth_state", state)
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
    })

    if (typeof window !== "undefined") {
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    }
}

export async function signInWithSSO(email: string): Promise<void> {
    throw new Error(
        "SSO is not supported with the current authentication system."
    )
}
