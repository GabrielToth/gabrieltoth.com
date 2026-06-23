"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React, { useCallback, useEffect, useState } from "react"
import {
    updateUserProfile,
    disconnectIntegration,
    connectIntegration,
} from "@/lib/api/user"
import { connectChannel, disconnectChannel } from "@/lib/api/channels"
import { BillingSection } from "./BillingSection"
import { ChannelsSection } from "./ChannelsSection"
import { IntegrationsSection } from "./IntegrationsSection"
import { LocalEnvSection } from "./LocalEnvSection"
import { PreferencesSection } from "./PreferencesSection"
import { ProfileSection } from "./ProfileSection"
import { SecuritySection } from "./SecuritySection"

/**
 * User type definition
 */
export interface User {
    id: string
    name: string
    email: string
    profilePhoto?: string
    createdAt: Date
    updatedAt: Date
}

/**
 * SocialChannel type definition
 */
export interface SocialChannel {
    id: string
    platform:
        | "facebook"
        | "instagram"
        | "twitter"
        | "tiktok"
        | "linkedin"
        | "youtube"
    accountId: string
    accountName: string
    isConnected: boolean
    connectedAt?: Date
}

/**
 * Preferences type definition
 */
export interface Preferences {
    notificationsEnabled: boolean
    language: "en" | "pt" | "es" | "fr"
    theme: "light" | "dark" | "auto"
    timezone: string
}

/**
 * BillingInfo type definition
 */
export interface BillingInfo {
    plan: string
    price: number
    nextBillingDate: Date
    invoices: Invoice[]
}

/**
 * Invoice type definition
 */
export interface Invoice {
    id: string
    date: Date
    amount: number
    status: "paid" | "pending" | "failed"
    downloadUrl: string
}

/**
 * Integration type definition
 */
export interface Integration {
    id: string
    name: string
    icon: string
    isConnected: boolean
    connectedAt?: Date
}

/**
 * SettingsContainerProps
 */
export interface SettingsContainerProps {
    children?: React.ReactNode
}

/**
 * SettingsContainer Component
 * Main container for Settings tab
 * Manages state for all settings sections
 * Coordinates all settings sections
 *
 * Features:
 * - Manages user profile state
 * - Manages preferences state
 * - Manages connected channels
 * - Manages security settings
 * - Manages billing information
 * - Manages integrations
 * - API integration for fetching and updating settings
 * - Loading and error states
 * - Data caching
 * - Responsive layout
 */
export const SettingsContainer: React.FC<SettingsContainerProps> = ({
    children,
}) => {
    // State management
    const [user, setUser] = useState<User | null>(null)
    const [preferences, setPreferences] = useState<Preferences>({
        notificationsEnabled: true,
        language: "en",
        theme: "auto",
        timezone: "UTC",
    })
    const [channels, setChannels] = useState<SocialChannel[]>([])
    const [billing, setBilling] = useState<BillingInfo | null>(null)
    const [integrations, setIntegrations] = useState<Integration[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("profile")

    /**
     * Fetch user data from API
     */
    const handleFetchUser = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Mock data for development
            const userData: User = {
                id: "1",
                name: "John Doe",
                email: "john@example.com",
                profilePhoto: "https://via.placeholder.com/150",
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            setUser(userData)
            setIsLoading(false)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to fetch user data"
            )
            setIsLoading(false)
        }
    }, [])

    /**
     * Fetch channels from API
     */
    const handleFetchChannels = useCallback(async () => {
        try {
            // Mock data for development
            const channelsData: SocialChannel[] = [
                {
                    id: "1",
                    platform: "facebook",
                    accountId: "123456",
                    accountName: "John's Facebook",
                    isConnected: true,
                    connectedAt: new Date(),
                },
                {
                    id: "2",
                    platform: "instagram",
                    accountId: "789012",
                    accountName: "john_instagram",
                    isConnected: true,
                    connectedAt: new Date(),
                },
                {
                    id: "3",
                    platform: "twitter",
                    accountId: "345678",
                    accountName: "@johndoe",
                    isConnected: false,
                },
            ]

            setChannels(channelsData)
        } catch (err) {
            console.error("Failed to fetch channels:", err)
        }
    }, [])

    /**
     * Fetch billing information from API
     */
    const handleFetchBilling = useCallback(async () => {
        try {
            // Mock data for development
            const billingData: BillingInfo = {
                plan: "Pro",
                price: 29.99,
                nextBillingDate: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                ),
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

            setBilling(billingData)
        } catch (err) {
            console.error("Failed to fetch billing:", err)
        }
    }, [])

    /**
     * Fetch integrations from API
     */
    const handleFetchIntegrations = useCallback(async () => {
        try {
            // Mock data for development
            const integrationsData: Integration[] = [
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

            setIntegrations(integrationsData)
        } catch (err) {
            console.error("Failed to fetch integrations:", err)
        }
    }, [])

    // Fetch data on mount
    useEffect(() => {
        handleFetchUser()
        handleFetchChannels()
        handleFetchBilling()
        handleFetchIntegrations()
    }, [
        handleFetchUser,
        handleFetchChannels,
        handleFetchBilling,
        handleFetchIntegrations,
    ])

    // Handle user save
    const handleSaveUser = async (updatedUser: User) => {
        try {
            const saved = await updateUserProfile(updatedUser)
            setUser(saved)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save user profile"
            )
        }
    }

    // Handle preferences save
    const handleSavePreferences = (updatedPreferences: Preferences) => {
        setPreferences(updatedPreferences)
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(
                    "user-timezone",
                    updatedPreferences.timezone
                )
            } catch {}
        }
    }

    // Handle channel disconnect
    const handleDisconnectChannel = async (channelId: string) => {
        try {
            await disconnectChannel(channelId)
        } catch (err) {
            console.error("Failed to disconnect channel:", err)
        }
    }

    // Handle channel connect
    const handleConnectChannel = async () => {
        try {
            await connectChannel("facebook")
        } catch (err) {
            console.error("Failed to connect channel:", err)
        }
    }

    // Handle billing upgrade
    const handleUpgradePlan = () => {
        alert("Upgrade not available yet")
    }

    // Handle integration disconnect
    const handleDisconnectIntegration = async (integrationId: string) => {
        try {
            await disconnectIntegration(integrationId)
        } catch (err) {
            console.error("Failed to disconnect integration:", err)
        }
    }

    // Handle integration connect
    const handleConnectIntegration = async () => {
        try {
            await connectIntegration("1")
        } catch (err) {
            console.error("Failed to connect integration:", err)
        }
    }

    // If children are provided, render them
    if (children) {
        return <div className="space-y-6">{children}</div>
    }

    // Default render with all settings sections
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Settings
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage your account settings and preferences
                    </p>
                </div>
            </div>

            {/* Settings Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="channels">Channels</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    <TabsTrigger value="local-apis">APIs Locais</TabsTrigger>
                </TabsList>

                {/* Profile Section */}
                <TabsContent value="profile">
                    {user && (
                        <ProfileSection
                            user={user}
                            onSave={handleSaveUser}
                            isLoading={isLoading}
                            error={error}
                        />
                    )}
                </TabsContent>

                {/* Preferences Section */}
                <TabsContent value="preferences">
                    <PreferencesSection
                        preferences={preferences}
                        onSave={handleSavePreferences}
                    />
                </TabsContent>

                {/* Channels Section */}
                <TabsContent value="channels">
                    <ChannelsSection
                        channels={channels}
                        onDisconnect={handleDisconnectChannel}
                        onConnect={handleConnectChannel}
                    />
                </TabsContent>

                {/* Security Section */}
                <TabsContent value="security">
                    <SecuritySection user={user} />
                </TabsContent>

                {/* Billing Section */}
                <TabsContent value="billing">
                    {billing && (
                        <BillingSection
                            billing={billing}
                            onUpgrade={handleUpgradePlan}
                        />
                    )}
                </TabsContent>

                {/* Integrations Section */}
                <TabsContent value="integrations">
                    <IntegrationsSection
                        integrations={integrations}
                        onDisconnect={handleDisconnectIntegration}
                        onConnect={handleConnectIntegration}
                    />
                </TabsContent>

                {/* Local APIs Section */}
                <TabsContent value="local-apis">
                    <LocalEnvSection />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default SettingsContainer
