"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronUp, FolderPlus } from "lucide-react"

interface ChannelGroupMember {
    id: string
    group_id: string
    platform: string
    platform_username: string
    platform_user_id: string
}

interface ChannelGroup {
    id: string
    name: string
    description: string
    members: ChannelGroupMember[]
}

interface ConnectedChannel {
    id: string
    platform: string
    accountName: string
    accountId: string
}

const PLATFORM_COLORS: Record<string, string> = {
    twitch: "bg-purple-600",
    kick: "bg-emerald-600",
    youtube: "bg-red-600",
    facebook: "bg-blue-600",
    instagram: "bg-pink-600",
    tiktok: "bg-neutral-600",
    linkedin: "bg-blue-800",
    twitter: "bg-sky-600",
}

interface ChannelGroupManagerProps {
    connectedChannels?: ConnectedChannel[]
}

export function ChannelGroupManager({
    connectedChannels = [],
}: ChannelGroupManagerProps) {
    const [groups, setGroups] = useState<ChannelGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDesc, setNewDesc] = useState("")
    const [expanded, setExpanded] = useState<string | null>(null)
    const [selectedChannel, setSelectedChannel] = useState<string>("")

    const fetchGroups = useCallback(async () => {
        try {
            const res = await fetch("/api/channel-groups")
            if (res.ok) {
                const data = await res.json()
                if (data.success) setGroups(data.data || [])
            }
        } catch {
            // Silently handle error
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchGroups()
    }, [fetchGroups])

    const handleCreate = async () => {
        if (!newName.trim()) return
        try {
            const res = await fetch("/api/channel-groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newName.trim(),
                    description: newDesc.trim(),
                }),
            })
            if (res.ok) {
                setNewName("")
                setNewDesc("")
                setCreating(false)
                fetchGroups()
            }
        } catch {
            // Silently handle error
        }
    }

    const handleDelete = async (groupId: string) => {
        try {
            const res = await fetch(`/api/channel-groups?id=${groupId}`, {
                method: "DELETE",
            })
            if (res.ok) fetchGroups()
        } catch {
            // Silently handle error
        }
    }

    const handleAddMember = async (groupId: string) => {
        if (!selectedChannel) return
        const channel = connectedChannels.find(c => c.id === selectedChannel)
        if (!channel) return

        try {
            const res = await fetch("/api/channel-groups/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    groupId,
                    platform: channel.platform,
                    platformUsername: channel.accountName,
                    platformUserId: channel.accountId || channel.id,
                }),
            })
            if (res.ok) {
                setSelectedChannel("")
                fetchGroups()
            }
        } catch {
            // Silently handle error
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        try {
            const res = await fetch(
                `/api/channel-groups/members?id=${memberId}`,
                { method: "DELETE" }
            )
            if (res.ok) fetchGroups()
        } catch {
            // Silently handle error
        }
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-neutral-800 bg-background p-4 text-center text-xs text-neutral-400">
                Loading groups...
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-neutral-800 bg-background p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                    <h3 className="text-sm font-semibold text-neutral-200">
                        Channel Groups
                    </h3>
                    <p className="text-xs text-neutral-400">
                        Organize channels to publish to multiple platforms
                        simultaneously
                    </p>
                </div>
                <button
                    onClick={() => setCreating(!creating)}
                    className="flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <FolderPlus className="h-3.5 w-3.5" />
                    <span>New Group</span>
                </button>
            </div>

            {creating && (
                <div className="rounded-lg border border-neutral-700 bg-card p-3 space-y-2">
                    <input
                        type="text"
                        placeholder="Group Name..."
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full text-xs rounded border border-neutral-700 bg-background px-3 py-2 text-neutral-200 focus:outline-none focus:border-primary"
                    />
                    <input
                        type="text"
                        placeholder="Description (optional)..."
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                        className="w-full text-xs rounded border border-neutral-700 bg-background px-3 py-2 text-neutral-200 focus:outline-none focus:border-primary"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setCreating(false)}
                            className="text-xs px-3 py-1 text-neutral-400 hover:text-neutral-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 font-medium"
                        >
                            Save Group
                        </button>
                    </div>
                </div>
            )}

            {groups.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-4">
                    No groups created yet. Create a group to organize your
                    connected channels.
                </p>
            ) : (
                <div className="space-y-2">
                    {groups.map(group => {
                        const isExpanded = expanded === group.id
                        return (
                            <div
                                key={group.id}
                                className="rounded-lg border border-neutral-800 bg-neutral-950/40 overflow-hidden"
                            >
                                <div
                                    onClick={() =>
                                        setExpanded(
                                            isExpanded ? null : group.id
                                        )
                                    }
                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-background transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-neutral-400" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                                        )}
                                        <div>
                                            <p className="text-xs font-semibold text-neutral-200">
                                                {group.name}
                                            </p>
                                            {group.description && (
                                                <p className="text-[10px] text-neutral-500">
                                                    {group.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono text-neutral-400 bg-card px-2 py-0.5 rounded-full">
                                            {group.members?.length || 0}{" "}
                                            channels
                                        </span>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation()
                                                handleDelete(group.id)
                                            }}
                                            className="text-neutral-500 hover:text-rose-400 p-1"
                                            title="Delete Group"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-neutral-800/60 p-3 bg-background space-y-3">
                                        {/* Add Channel to Group Controls */}
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={selectedChannel}
                                                onChange={e =>
                                                    setSelectedChannel(
                                                        e.target.value
                                                    )
                                                }
                                                className="flex-1 text-xs rounded border border-neutral-700 bg-background px-2 py-1.5 text-neutral-200 focus:outline-none focus:border-primary"
                                            >
                                                <option value="">
                                                    Select connected channel to
                                                    add...
                                                </option>
                                                {connectedChannels.map(ch => (
                                                    <option
                                                        key={ch.id}
                                                        value={ch.id}
                                                    >
                                                        {ch.platform.toUpperCase()}{" "}
                                                        — {ch.accountName}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() =>
                                                    handleAddMember(group.id)
                                                }
                                                disabled={!selectedChannel}
                                                className="flex items-center gap-1 text-xs bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1.5 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                <span>Add</span>
                                            </button>
                                        </div>

                                        {/* Group Members List */}
                                        <div className="space-y-1.5">
                                            {!group.members ||
                                            group.members.length === 0 ? (
                                                <p className="text-[11px] text-neutral-500 italic py-1">
                                                    No channels in this group
                                                    yet.
                                                </p>
                                            ) : (
                                                group.members.map(m => (
                                                    <div
                                                        key={m.id}
                                                        className="flex items-center justify-between rounded bg-card px-2.5 py-1.5 text-xs"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold text-white uppercase ${PLATFORM_COLORS[m.platform] || "bg-neutral-600"}`}
                                                            >
                                                                {m.platform}
                                                            </span>
                                                            <span className="font-medium text-neutral-200">
                                                                {
                                                                    m.platform_username
                                                                }
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                handleRemoveMember(
                                                                    m.id
                                                                )
                                                            }
                                                            className="text-neutral-500 hover:text-rose-400 p-0.5"
                                                            title="Remove from group"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
