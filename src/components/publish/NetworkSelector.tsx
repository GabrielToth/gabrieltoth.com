"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertCircle,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Youtube,
} from "lucide-react"
import React, { useMemo, useState } from "react"

interface Network {
    id: string
    platform: string
    status: "connected" | "disconnected" | "expired"
    metadata?: Record<string, any>
}

interface NetworkGroup {
    id: string
    name: string
    networkIds: string[]
}

interface NetworkSelectorProps {
    networks: Network[]
    groups: NetworkGroup[]
    selectedNetworkIds: string[]
    onNetworkToggle: (networkId: string) => void
    onGroupToggle: (groupId: string) => void
    onSelectAll: () => void
    onDeselectAll: () => void
}

const platformIcons: Record<string, React.ReactNode> = {
    youtube: <Youtube className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
    linkedin: <Linkedin className="h-4 w-4" />,
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
                <h3 className="font-semibold">Select Networks</h3>
                <p className="text-sm text-gray-600">
                    {selectedNetworkIds.length} of {networks.length} selected
                </p>
            </div>

            <div className="space-y-3">
                <Input
                    placeholder="Search networks or groups..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    aria-label="Search networks"
                />

                <div className="flex gap-2">
                    <Select
                        value={sortBy}
                        onValueChange={(v: any) => setSortBy(v)}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Sort by Name</SelectItem>
                            <SelectItem value="status">
                                Sort by Status
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <button
                        onClick={onSelectAll}
                        className="text-sm text-blue-600 hover:underline"
                        aria-label="Select all networks"
                    >
                        Select All
                    </button>
                    <button
                        onClick={onDeselectAll}
                        className="text-sm text-blue-600 hover:underline"
                        aria-label="Deselect all networks"
                    >
                        Deselect All
                    </button>
                </div>
            </div>

            {filteredGroups.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                    <h4 className="text-sm font-medium">Groups</h4>
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
                                        if (el && state === "indeterminate") {
                                            el.indeterminate = true
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
                <h4 className="text-sm font-medium">Networks</h4>
                {filteredNetworks.length === 0 ? (
                    <p className="text-sm text-gray-500">No networks found</p>
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
