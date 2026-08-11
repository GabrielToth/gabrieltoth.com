"use client"

import { useCallback, useEffect, useState } from "react"

interface ChannelGroupMember {
    id: string
    group_id: string
    platform: string
    platform_username: string
    platform_user_id: string
    settings: Record<string, unknown>
}

interface ChannelGroup {
    id: string
    name: string
    description: string
    members: ChannelGroupMember[]
}

interface SocialNetwork {
    id: string
    platform: string
    platform_username: string
    display_name?: string
}

const PLATFORM_COLORS: Record<string, string> = {
    twitch: "bg-purple-600", kick: "bg-emerald-600", youtube: "bg-red-600",
    facebook: "bg-blue-600", instagram: "bg-pink-600", tiktok: "bg-neutral-600",
    linkedin: "bg-blue-800", twitter: "bg-sky-600",
}

export function ChannelGroupManager() {
    const [groups, setGroups] = useState<ChannelGroup[]>([])
    const [networks, setNetworks] = useState<SocialNetwork[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDesc, setNewDesc] = useState("")
    const [expanded, setExpanded] = useState<string | null>(null)
    const [addingTo, setAddingTo] = useState<string | null>(null)

    const fetchGroups = useCallback(async () => {
        try {
            const res = await fetch("/api/channel-groups")
            if (res.ok) {
                const data = await res.json()
                if (data.success) setGroups(data.data)
            }
        } catch {} finally { setLoading(false) }
    }, [])

    const fetchNetworks = useCallback(async () => {
        try {
            const res = await fetch("/api/oauth/status")
            if (res.ok) {
                const data = await res.json()
                if (data.success) setNetworks(data.data || [])
            }
        } catch {}
    }, [])

    useEffect(() => { fetchGroups(); fetchNetworks() }, [fetchGroups, fetchNetworks])

    const handleCreate = useCallback(async () => {
        if (!newName.trim()) return
        await fetch("/api/channel-groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName, description: newDesc }),
        })
        setNewName(""); setNewDesc(""); setCreating(false)
        fetchGroups()
    }, [newName, newDesc, fetchGroups])

    const handleDelete = useCallback(async (id: string) => {
        await fetch(`/api/channel-groups/${id}`, { method: "DELETE" })
        fetchGroups()
    }, [fetchGroups])

    const handleAddMember = useCallback(async (groupId: string, network: SocialNetwork) => {
        await fetch(`/api/channel-groups/${groupId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                platform: network.platform,
                platform_username: network.platform_username,
                social_network_id: network.id,
            }),
        })
        setAddingTo(null)
        fetchGroups()
    }, [fetchGroups])

    const handleRemoveMember = useCallback(async (groupId: string, memberId: string) => {
        await fetch(`/api/channel-groups/${groupId}/members?memberId=${memberId}`, { method: "DELETE" })
        fetchGroups()
    }, [fetchGroups])

    if (loading) return <div className="text-sm text-neutral-400">Loading groups...</div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-200">Channel Groups</h2>
                <button
                    onClick={() => setCreating(!creating)}
                    className="rounded-lg bg-indigo-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600"
                >
                    {creating ? "Cancel" : "New Group"}
                </button>
            </div>

            {creating && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-3 space-y-2">
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Group name"
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-100 focus:outline-none"
                    />
                    <input
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs text-neutral-100 focus:outline-none"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!newName.trim()}
                        className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                        Create Group
                    </button>
                </div>
            )}

            {groups.length === 0 && !creating && (
                <p className="text-xs text-neutral-500 text-center py-4">No groups yet. Create one to organize your channels.</p>
            )}

            {groups.map(group => (
                <div key={group.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60">
                    <button
                        onClick={() => setExpanded(expanded === group.id ? null : group.id)}
                        className="w-full flex items-center justify-between p-3"
                    >
                        <div className="text-left">
                            <p className="text-sm font-semibold text-neutral-200">{group.name}</p>
                            {group.description && <p className="text-[10px] text-neutral-500">{group.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-neutral-500">{group.members?.length || 0} channels</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(group.id) }}
                                className="text-neutral-600 hover:text-red-400 text-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </button>

                    {expanded === group.id && (
                        <div className="border-t border-neutral-800 p-3 space-y-2">
                            {(group.members || []).map(m => (
                                <div key={m.id} className="flex items-center justify-between rounded-lg bg-neutral-800/40 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold text-white ${PLATFORM_COLORS[m.platform] || "bg-neutral-600"}`}>
                                            {m.platform.slice(0, 2).toUpperCase()}
                                        </span>
                                        <span className="text-xs text-neutral-300">{m.platform_username}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveMember(group.id, m.id)}
                                        className="text-neutral-600 hover:text-red-400 text-xs"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => setAddingTo(addingTo === group.id ? null : group.id)}
                                className="w-full rounded-lg border border-dashed border-neutral-700 py-2 text-xs text-neutral-500 hover:text-neutral-300"
                            >
                                {addingTo === group.id ? "Cancel" : "+ Add Channel"}
                            </button>

                            {addingTo === group.id && (
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {networks
                                        .filter(n => !(group.members || []).find(m => m.platform === n.platform && m.platform_username === n.platform_username))
                                        .map(n => (
                                            <button
                                                key={n.id}
                                                onClick={() => handleAddMember(group.id, n)}
                                                className="w-full flex items-center gap-2 rounded-lg bg-neutral-800/30 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800"
                                            >
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold text-white ${PLATFORM_COLORS[n.platform] || "bg-neutral-600"}`}>
                                                    {n.platform.slice(0, 2).toUpperCase()}
                                                </span>
                                                {n.platform_username}
                                            </button>
                                        ))}
                                    {networks.filter(n => !(group.members || []).find(m => m.platform === n.platform && m.platform_username === n.platform_username)).length === 0 && (
                                        <p className="text-xs text-neutral-600 text-center py-2">All channels already added</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
