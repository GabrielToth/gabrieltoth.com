"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface UseAutoLoginResult {
    isChecking: boolean
    isAuthenticated: boolean
    error: string | null
}

export function useAutoLogin(locale: string): UseAutoLoginResult {
    const router = useRouter()
    const [state, setState] = useState<UseAutoLoginResult>({
        isChecking: true,
        isAuthenticated: false,
        error: null,
    })

    useEffect(() => {
        let cancelled = false

        async function checkSession() {
            try {
                // Check if we have a remember_me_token cookie by trying a refresh
                // This will create a new auth_session if the remember_me_token is valid
                const res = await fetch("/api/auth/refresh", {
                    method: "POST",
                    credentials: "include",
                })

                if (cancelled) return

                if (res.ok) {
                    setState({ isChecking: false, isAuthenticated: true, error: null })
                    // Redirect to dashboard
                    router.push(`/${locale}/dashboard`)
                } else {
                    setState({ isChecking: false, isAuthenticated: false, error: null })
                }
            } catch (err) {
                if (!cancelled) {
                    setState({
                        isChecking: false,
                        isAuthenticated: false,
                        error: err instanceof Error ? err.message : "Session check failed",
                    })
                }
            }
        }

        checkSession()
        return () => { cancelled = true }
    }, [locale, router])

    return state
}
