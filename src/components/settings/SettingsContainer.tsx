"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "next-intl"
import React, { useCallback, useEffect, useState } from "react"
import { updateUserProfile } from "@/lib/api/user"
import { logger } from "@/lib/logger"

import { BillingSection } from "./BillingSection"
import { ChannelsSection } from "./ChannelsSection"
import { IntegrationsSection } from "./IntegrationsSection"
import { LocalEnvSection } from "./LocalEnvSection"
import { PreferencesSection } from "./PreferencesSection"
import { ProfileSection } from "./ProfileSection"
import { SecuritySection } from "./SecuritySection"

export interface User {
    id: string
    name: string
    email: string
    profilePhoto?: string
    createdAt: Date
    updatedAt: Date
}

export interface SocialChannel {
    id: string
    platform: string
    accountId: string
    accountName: string
    isConnected: boolean
    connectedAt?: Date
    needsReconnect?: boolean
}

export interface Preferences {
    notificationsEnabled: boolean
    language: "en" | "pt" | "es" | "fr"
    theme: "light" | "dark" | "auto"
    timezone: string
}

export interface BillingInfo {
    plan: string
    price: number
    nextBillingDate: Date
    invoices: Invoice[]
}

export interface Invoice {
    id: string
    date: Date
    amount: number
    status: "paid" | "pending" | "failed"
    downloadUrl: string
}

export interface Integration {
    id: string
    name: string
    icon: string
    isConnected: boolean
    connectedAt?: Date
}

export interface SettingsContainerProps {
    children?: React.ReactNode
}

export const SettingsContainer: React.FC<SettingsContainerProps> = () => {
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
    const t = useTranslations("dashboard.settings")

    const handleFetchUser = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const res = await fetch("/api/auth/me")
            if (res.ok) {
                const json = await res.json()
                if (json.user) {
                    setUser({
                        id: json.user.id,
                        name: json.user.name || "User",
                        email: json.user.email || "",
                        profilePhoto: json.user.image || "",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    setIsLoading(false)
                    return
                }
            }

            // Fallback for session
            setUser({
                id: "1",
                name: "User Account",
                email: "user@gabrieltoth.com",
                profilePhoto: "",
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            setIsLoading(false)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to fetch user data"
            )
            setIsLoading(false)
        }
    }, [])

    const handleFetchChannels = useCallback(async () => {
        try {
            const res = await fetch("/api/networks/status")
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data)) {
                    setChannels(
                        data.map(
                            (item: {
                                id?: string
                                platform: string
                                accountId?: string
                                accountName?: string
                                isConnected?: boolean
                                connectedAt?: string
                                needsReconnect?: boolean
                            }) => ({
                                id: item.id || item.platform,
                                platform: item.platform,
                                accountId: item.accountId || item.id || "",
                                accountName: item.accountName || item.platform,
                                isConnected: item.isConnected ?? true,
                                connectedAt: item.connectedAt
                                    ? new Date(item.connectedAt)
                                    : new Date(),
                                needsReconnect: item.needsReconnect || false,
                            })
                        )
                    )
                    return
                }
            }
            setChannels([])
        } catch (err) {
            logger.error("Failed to fetch channels", { error: err })
            setChannels([])
        }
    }, [])

    const handleFetchBilling = useCallback(async () => {
        try {
            const res = await fetch("/api/credits/balance")
            let creditsBalance = 1000
            if (res.ok) {
                const json = await res.json()
                if (typeof json.balance === "number") {
                    creditsBalance = json.balance
                }
            }

            const billingData: BillingInfo = {
                plan: creditsBalance > 500 ? "Pro Creator" : "Free Starter",
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
                        downloadUrl: "/api/credits/transactions",
                    },
                ],
            }

            setBilling(billingData)
        } catch (err) {
            logger.error("Failed to fetch billing", { error: err })
        }
    }, [])

    const handleFetchIntegrations = useCallback(async () => {
        setIntegrations([
            {
                id: "1",
                name: "Discord Webhooks",
                icon: "discord",
                isConnected: true,
                connectedAt: new Date(),
            },
            {
                id: "2",
                name: "Telegram Bot",
                icon: "telegram",
                isConnected: true,
                connectedAt: new Date(),
            },
            {
                id: "3",
                name: "YouTube gRPC Relay",
                icon: "youtube",
                isConnected: true,
                connectedAt: new Date(),
            },
        ])
    }, [])

    const handleSaveProfile = async (updatedUser: User) => {
        try {
            setIsLoading(true)
            await updateUserProfile({
                name: updatedUser.name,
                profilePhoto: updatedUser.profilePhoto,
            })
            setUser(updatedUser)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to update profile"
            )
        } finally {
            setIsLoading(false)
        }
    }

    const handleSavePreferences = (updatedPreferences: Preferences) => {
        setPreferences(updatedPreferences)
        if (typeof window !== "undefined") {
            localStorage.setItem(
                "user-preferences",
                JSON.stringify(updatedPreferences)
            )
        }
    }

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

    if (isLoading && !user) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-sm text-muted-foreground">
                    Loading settings...
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    {t("title")}
                </h1>
                <p className="mt-2 text-muted-foreground">{t("description")}</p>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
            >
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 gap-1">
                    <TabsTrigger value="profile">
                        {t("tabs.profile")}
                    </TabsTrigger>
                    <TabsTrigger value="preferences">
                        {t("tabs.preferences")}
                    </TabsTrigger>
                    <TabsTrigger value="channels">
                        {t("tabs.channels")}
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        {t("tabs.security")}
                    </TabsTrigger>
                    <TabsTrigger value="billing">
                        {t("tabs.billing")}
                    </TabsTrigger>
                    <TabsTrigger value="integrations">
                        {t("tabs.integrations")}
                    </TabsTrigger>
                    <TabsTrigger value="localenv">Local ENV</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    {user && (
                        <ProfileSection
                            user={user}
                            onSave={handleSaveProfile}
                            isLoading={isLoading}
                            error={error}
                        />
                    )}
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                    <PreferencesSection
                        preferences={preferences}
                        onSave={handleSavePreferences}
                    />
                </TabsContent>

                <TabsContent value="channels" className="space-y-6">
                    <ChannelsSection
                        channels={channels}
                        onConnect={async () => {
                            await handleFetchChannels()
                        }}
                        onDisconnect={async () => {
                            await handleFetchChannels()
                        }}
                    />
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <SecuritySection user={user} />
                </TabsContent>

                <TabsContent value="billing" className="space-y-6">
                    {billing && (
                        <BillingSection
                            billing={billing}
                            onUpgrade={() => {
                                window.location.href = "/dashboard/credits"
                            }}
                        />
                    )}
                </TabsContent>

                <TabsContent value="integrations" className="space-y-6">
                    <IntegrationsSection
                        integrations={integrations}
                        onConnect={async () => {}}
                        onDisconnect={async () => {}}
                    />
                </TabsContent>

                <TabsContent value="localenv" className="space-y-6">
                    <LocalEnvSection />
                </TabsContent>
            </Tabs>
        </div>
    )
}
