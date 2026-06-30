"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    SiFacebook,
    SiInstagram,
    SiX,
    SiYoutube,
} from "@icons-pack/react-simple-icons"
import { AlertCircle } from "lucide-react"
import React, { useMemo, useState } from "react"
import { FaLinkedin } from "react-icons/fa6"

export interface Network {
    id: string
    platform: string
    status: "connected" | "disconnected" | "expired"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>
}

export interface NetworkGroup {
    id: string
    name: string
    networkIds: string[]
}

export interface NetworkSelectorProps {
    networks: Network[]
    groups: NetworkGroup[]
    selectedNetworkIds: string[]
    onNetworkToggle: (networkId: string) => void
    onGroupToggle: (groupId: string) => void
    onSelectAll: () => void
    onDeselectAll: () => void
}

const platformIcons: Record<string, React.ReactNode> = {
    youtube: <SiYoutube className="h-4 w-4" />,
    facebook: <SiFacebook className="h-4 w-4" />,
    instagram: <SiInstagram className="h-4 w-4" />,
    twitter: <SiX className="h-4 w-4" />,
    linkedin: <FaLinkedin className="h-4 w-4" />,
}

export default function NetworkSelector({
    networks,
    groups,
    selectedNetworkIds,
    onNetworkToggle,
    onGroupToggle,
    onSelectAll,
    onDeselectAll,
}: NetworkSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState<"name" | "status">("name")
    const t = useTranslations("dashboard.publish")

    const filteredNetworks = useMemo(() => {
        return networks
            .filter(
                n =>
                    n.platform
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    n.id.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                if (sortBy === "status") {
                    const statusOrder = {
                        connected: 0,
                        disconnected: 1,
                        expired: 2,
                    }
                    return statusOrder[a.status] - statusOrder[b.status]
                }
                return a.platform.localeCompare(b.platform)
            })
    }, [networks, searchTerm, sortBy])

    const filteredGroups = useMemo(() => {
        return groups.filter(g =>
            g.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [groups, searchTerm])

    const getGroupState = (groupId: string) => {
        const group = groups.find(g => g.id === groupId)
        if (!group) return "unchecked"

        const selectedCount = group.networkIds.filter(id =>
            selectedNetworkIds.includes(id)
        ).length

        if (selectedCount === 0) return "unchecked"
        if (selectedCount === group.networkIds.length) return "checked"
        return "indeterminate"
    }

    const statusColors: Record<string, string> = {
        connected: "bg-green-100 text-green-800",
        disconnected: "bg-gray-100 text-gray-800",
        expired: "bg-red-100 text-red-800",
    }

    const statusLabels: Record<string, string> = {
        connected: "Connected",
        disconnected: "Disconnected",
        expired: "Expired",
    }

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
                <h3 className="font-semibold">{t("selectNetworks")}</h3>
                <p className="text-sm text-gray-600">
                    {t("xOfYSelected", {
                        selected: selectedNetworkIds.length,
                        total: networks.length,
                    })}
                </p>
            </div>

            <div className="space-y-3">
                <Input
                    placeholder={t("searchNetworks")}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    aria-label={t("searchNetworks")}
                />

                <div className="flex gap-2">
                    <Select
                        value={sortBy}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onValueChange={(v: any) => setSortBy(v)}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">
                                {t("sortByName")}
                            </SelectItem>
                            <SelectItem value="status">
                                {t("sortByStatus")}
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <button
                        onClick={onSelectAll}
                        className="text-sm text-blue-600 hover:underline"
                        aria-label={t("selectAll")}
                    >
                        {t("selectAll")}
                    </button>
                    <button
                        onClick={onDeselectAll}
                        className="text-sm text-blue-600 hover:underline"
                        aria-label={t("deselectAll")}
                    >
                        {t("deselectAll")}
                    </button>
                </div>
            </div>

            {filteredGroups.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                    <h4 className="text-sm font-medium">{t("groups")}</h4>
                    {filteredGroups.map(group => {
                        const state = getGroupState(group.id)
                        return (
                            <div
                                key={group.id}
                                className="flex items-center gap-2"
                            >
                                <Checkbox
                                    id={`group-${group.id}`}
                                    checked={state === "checked"}
                                    ref={el => {
                                        if (
                                            el &&
                                            state === "indeterminate" &&
                                            "indeterminate" in el
                                        ) {
                                            ;(
                                                el as unknown as HTMLInputElement
                                            ).indeterminate = true
                                        }
                                    }}
                                    onCheckedChange={() =>
                                        onGroupToggle(group.id)
                                    }
                                    aria-label={`${group.name} group`}
                                />
                                <label
                                    htmlFor={`group-${group.id}`}
                                    className="cursor-pointer text-sm font-medium"
                                >
                                    {group.name}
                                </label>
                                <span className="text-xs text-gray-500">
                                    ({group.networkIds.length})
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="space-y-2 border-t pt-3">
                <h4 className="text-sm font-medium">{t("networks")}</h4>
                {filteredNetworks.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        {t("noNetworksFound")}
                    </p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {filteredNetworks.map(network => (
                            <div
                                key={network.id}
                                className="flex items-center gap-3 rounded p-2 hover:bg-gray-50"
                            >
                                <Checkbox
                                    id={`network-${network.id}`}
                                    checked={selectedNetworkIds.includes(
                                        network.id
                                    )}
                                    onCheckedChange={() =>
                                        onNetworkToggle(network.id)
                                    }
                                    aria-label={`${network.platform} network`}
                                />
                                <div className="flex flex-1 items-center gap-2">
                                    {platformIcons[
                                        network.platform.toLowerCase()
                                    ] || <div className="h-4 w-4" />}
                                    <label
                                        htmlFor={`network-${network.id}`}
                                        className="cursor-pointer flex-1 text-sm font-medium capitalize"
                                    >
                                        {network.platform}
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className={statusColors[network.status]}
                                    >
                                        {statusLabels[network.status]}
                                    </Badge>
                                    {network.status === "expired" && (
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
