"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import React, { useState } from "react"
import { Integration } from "./SettingsContainer"

/**
 * IntegrationsSectionProps
 */
export interface IntegrationsSectionProps {
    integrations: Integration[]
    onDisconnect: (integrationId: string) => void
    onConnect: () => void
}

/**
 * IntegrationsSection Component
 * Third-party integrations management
 * List connected integrations
 * Disconnect button for each integration
 * Add Integration button
 * Connection status display
 *
 * Features:
 * - Display connected integrations
 * - Show connection status
 * - Disconnect integrations
 * - Add new integrations
 * - Confirmation dialogs
 */
export const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({
    integrations,
    onDisconnect,
    onConnect,
}) => {
    const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
    const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(
        null
    )

    /**
     * Handle disconnect click
     */
    const handleDisconnectClick = (integrationId: string) => {
        setConfirmDisconnect(integrationId)
    }

    /**
     * Confirm disconnect
     */
    const handleConfirmDisconnect = async (integrationId: string) => {
        try {
            setDisconnectingId(integrationId)
            onDisconnect(integrationId)
            setConfirmDisconnect(null)
        } finally {
            setDisconnectingId(null)
        }
    }

    const connectedIntegrations = integrations.filter(i => i.isConnected)
    const availableIntegrations = integrations.filter(i => !i.isConnected)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                    Connect third-party apps to extend functionality
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Connected Integrations */}
                {connectedIntegrations.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Connected Apps ({connectedIntegrations.length})
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            {connectedIntegrations.map(integration => (
                                <div
                                    key={integration.id}
                                    className="rounded-lg border border-gray-200 p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                name={integration.icon}
                                                size="md"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {integration.name}
                                                </p>
                                                {integration.connectedAt && (
                                                    <p className="text-xs text-gray-500">
                                                        Connected on{" "}
                                                        {new Date(
                                                            integration.connectedAt
                                                        ).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                            Connected
                                        </span>
                                    </div>
                                    <div className="mt-4">
                                        {confirmDisconnect ===
                                        integration.id ? (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setConfirmDisconnect(
                                                            null
                                                        )
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                        handleConfirmDisconnect(
                                                            integration.id
                                                        )
                                                    }
                                                    disabled={
                                                        disconnectingId ===
                                                        integration.id
                                                    }
                                                >
                                                    {disconnectingId ===
                                                    integration.id
                                                        ? "Disconnecting..."
                                                        : "Confirm"}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full text-red-600 hover:bg-red-50"
                                                onClick={() =>
                                                    handleDisconnectClick(
                                                        integration.id
                                                    )
                                                }
                                            >
                                                Disconnect
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Integrations */}
                {availableIntegrations.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Available Apps ({availableIntegrations.length})
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            {availableIntegrations.map(integration => (
                                <div
                                    key={integration.id}
                                    className="rounded-lg border border-gray-200 p-4 opacity-60"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                name={integration.icon}
                                                size="md"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {integration.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Not connected
                                                </p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                            Available
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add Integration Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={onConnect}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Add Integration
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default IntegrationsSection
