/**
 * User Settings API Service
 * Handles fetching, updating user settings, preferences, and related data
 * Includes caching and error handling
 */

import {
    BillingInfo,
    Integration,
    Preferences,
    User,
} from "@/components/settings"

// Cache storage
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch user profile from API
 * Implements caching to reduce API calls
 */
export async function fetchUserProfile(): Promise<User> {
    const cacheKey = "user-profile"
    const now = Date.now()

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data as User
    }

    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/user/profile')
        // const data = await response.json()

        // Mock data for development
        const data: User = {
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            profilePhoto: "https://via.placeholder.com/150",
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        // Cache the result
        cache.set(cacheKey, { data, timestamp: now })

        return data
    } catch (error) {
        console.error("Failed to fetch user profile:", error)
        throw new Error("Failed to fetch user profile")
    }
}

/**
 * Update user profile
 */
export async function updateUserProfile(user: Partial<User>): Promise<User> {
    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/user/profile', {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(user)
        // })
        // const data = await response.json()

        const updatedUser: User = {
            id: user.id || "1",
            name: user.name || "John Doe",
            email: user.email || "john@example.com",
            profilePhoto: user.profilePhoto,
            createdAt: user.createdAt || new Date(),
            updatedAt: new Date(),
        }

        // Invalidate cache
        cache.delete("user-profile")

        return updatedUser
    } catch (error) {
        console.error("Failed to update user profile:", error)
        throw new Error("Failed to update user profile")
    }
}

/**
 * Fetch user preferences
 */
export async function fetchUserPreferences(): Promise<Preferences> {
    const cacheKey = "user-preferences"
    const now = Date.now()

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data as Preferences
    }

    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/user/preferences')
        // const data = await response.json()

        // Mock data for development
        const data: Preferences = {
            notificationsEnabled: true,
            language: "en",
            theme: "auto",
        }

        // Cache the result
        cache.set(cacheKey, { data, timestamp: now })

        return data
    } catch (error) {
        console.error("Failed to fetch user preferences:", error)
        throw new Error("Failed to fetch user preferences")
    }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
    preferences: Preferences
): Promise<Preferences> {
    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/user/preferences', {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(preferences)
        // })
        // const data = await response.json()

        // Invalidate cache
        cache.delete("user-preferences")

        return preferences
    } catch (error) {
        console.error("Failed to update user preferences:", error)
        throw new Error("Failed to update user preferences")
    }
}

/**
 * Fetch user billing information
 */
export async function fetchBillingInfo(): Promise<BillingInfo> {
    const cacheKey = "user-billing"
    const now = Date.now()

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data as BillingInfo
    }

    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/user/billing')
        // const data = await response.json()

        // Mock data for development
        const data: BillingInfo = {
            plan: "Pro",
            price: 29.99,
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            invoices: [
                {
                    id: "inv-001",
                    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    amount: 29.99,
                    status: "paid",
                    downloadUrl: "#",
                },
                {
                    id: "inv-002",
                    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                    amount: 29.99,
                    status: "paid",
                    downloadUrl: "#",
                },
            ],
        }

        // Cache the result
        cache.set(cacheKey, { data, timestamp: now })

        return data
    } catch (error) {
        console.error("Failed to fetch billing information:", error)
        throw new Error("Failed to fetch billing information")
    }
}

/**
 * Fetch user integrations
 */
export async function fetchIntegrations(): Promise<Integration[]> {
    const cacheKey = "user-integrations"
    const now = Date.now()

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data as Integration[]
    }

    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/user/integrations')
        // const data = await response.json()

        // Mock data for development
        const data: Integration[] = [
            {
                id: "1",
                name: "Zapier",
                icon: "zapier",
                isConnected: true,
                connectedAt: new Date(),
            },
            {
                id: "2",
                name: "Slack",
                icon: "slack",
                isConnected: false,
            },
            {
                id: "3",
                name: "Google Analytics",
                icon: "google",
                isConnected: true,
                connectedAt: new Date(),
            },
        ]

        // Cache the result
        cache.set(cacheKey, { data, timestamp: now })

        return data
    } catch (error) {
        console.error("Failed to fetch integrations:", error)
        throw new Error("Failed to fetch integrations")
    }
}

/**
 * Connect an integration
 */
export async function connectIntegration(
    integrationId: string
): Promise<Integration> {
    try {
        // In production, replace with actual API call
        // const response = await fetch(`/api/user/integrations/${integrationId}/connect`, {
        //   method: 'POST'
        // })
        // const data = await response.json()

        // Invalidate cache
        cache.delete("user-integrations")

        return {
            id: integrationId,
            name: "Integration",
            icon: "link",
            isConnected: true,
            connectedAt: new Date(),
        }
    } catch (error) {
        console.error("Failed to connect integration:", error)
        throw new Error("Failed to connect integration")
    }
}

/**
 * Disconnect an integration
 */
export async function disconnectIntegration(
    integrationId: string
): Promise<void> {
    try {
        // In production, replace with actual API call
        // const response = await fetch(`/api/user/integrations/${integrationId}/disconnect`, {
        //   method: 'POST'
        // })

        // Invalidate cache
        cache.delete("user-integrations")
    } catch (error) {
        console.error("Failed to disconnect integration:", error)
        throw new Error("Failed to disconnect integration")
    }
}

/**
 * Change password
 */
export async function changePassword(
    currentPassword: string,
    newPassword: string
): Promise<void> {
    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/user/change-password', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ currentPassword, newPassword })
        // })

        // Invalidate cache
        cache.delete("user-profile")
    } catch (error) {
        console.error("Failed to change password:", error)
        throw new Error("Failed to change password")
    }
}

/**
 * Enable 2FA
 */
export async function enableTwoFactor(): Promise<{
    secret: string
    qrCode: string
}> {
    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/user/2fa/enable', {
        //   method: 'POST'
        // })
        // const data = await response.json()

        return {
            secret: "JBSWY3DPEBLW64TMMQ======",
            qrCode: "data:image/png;base64,...",
        }
    } catch (error) {
        console.error("Failed to enable 2FA:", error)
        throw new Error("Failed to enable 2FA")
    }
}

/**
 * Disable 2FA
 */
export async function disableTwoFactor(): Promise<void> {
    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/user/2fa/disable', {
        //   method: 'POST'
        // })

        // Invalidate cache
        cache.delete("user-profile")
    } catch (error) {
        console.error("Failed to disable 2FA:", error)
        throw new Error("Failed to disable 2FA")
    }
}

/**
 * Download invoice
 */
export async function downloadInvoice(invoiceId: string): Promise<Blob> {
    try {
        // In production, replace with actual API call
        // const response = await fetch(`/api/user/invoices/${invoiceId}/download`)
        // return await response.blob()

        return new Blob(["Invoice content"], { type: "application/pdf" })
    } catch (error) {
        console.error("Failed to download invoice:", error)
        throw new Error("Failed to download invoice")
    }
}

/**
 * Clear cache
 */
export function clearUserCache(): void {
    cache.delete("user-profile")
    cache.delete("user-preferences")
    cache.delete("user-billing")
    cache.delete("user-integrations")
}
