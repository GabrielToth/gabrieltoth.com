"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit2, GripVertical, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

interface Network {
    id: string
    platform: string
}

interface NetworkGroup {
    id: string
    name: string
    networkIds: string[]
}

interface NetworkGroupManagerProps {
    groups: NetworkGroup[]
    networks: Network[]
    onGroupCreate: (name: string, networkIds: string[]) => void
    onGroupUpdate: (groupId: string, name: string, networkIds: string[]) => void
    onGroupDelete: (groupId: string) => void
}

export default function NetworkGroupManager({
    groups,
    networks,
    onGroupCreate,
    onGroupUpdate,
    onGroupDelete,
}: NetworkGroupManagerProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
    const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
    const [groupName, setGroupName] = useState("")
    const [selectedNetworks, setSelectedNetworks] = useState<string[]>([])

    const handleCreateGroup = () => {
        if (!groupName.trim()) return

        onGroupCreate(groupName, selectedNetworks)
        setGroupName("")
        setSelectedNetworks([])
        setIsCreateOpen(false)
    }

    const handleEditGroup = (group: NetworkGroup) => {
        setEditingGroupId(group.id)
        setGroupName(group.name)
        setSelectedNetworks(group.networkIds)
    }

    const handleUpdateGroup = () => {
        if (!groupName.trim() || !editingGroupId) return

        onGroupUpdate(editingGroupId, groupName, selectedNetworks)
        setGroupName("")
        setSelectedNetworks([])
        setEditingGroupId(null)
    }

    const handleDeleteGroup = () => {
        if (deleteGroupId) {
            onGroupDelete(deleteGroupId)
            setDeleteGroupId(null)
        }
    }

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="font-semibold">Network Groups</h3>
                    <p className="text-sm text-gray-600">
                        Organize networks into groups for quick selection
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Network Group</DialogTitle>
                            <DialogDescription>
                                Create a new group to organize your networks
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="group-name">Group Name</Label>
                                <Input
                                    id="group-name"
                                    placeholder="e.g., Social Media, Professional"
                                    value={groupName}
                                    onChange={e => setGroupName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Select Networks</Label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {networks.map(network => (
                                        <div
                                            key={network.id}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={`network-${network.id}`}
                                                checked={selectedNetworks.includes(
                                                    network.id
                                                )}
                                                onCheckedChange={checked => {
                                                    if (checked) {
                                                        setSelectedNetworks([
                                                            ...selectedNetworks,
                                                            network.id,
                                                        ])
                                                    } else {
                                                        setSelectedNetworks(
                                                            selectedNetworks.filter(
                                                                id =>
                                                                    id !==
                                                                    network.id
                                                            )
                                                        )
                                                    }
                                                }}
                                            />
                                            <Label
                                                htmlFor={`network-${network.id}`}
                                                className="cursor-pointer capitalize"
                                            >
                                                {network.platform}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateGroup}
                                    disabled={
                                        !groupName.trim() ||
                                        selectedNetworks.length === 0
                                    }
                                    className="flex-1"
                                >
                                    Create
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {groups.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-sm text-gray-600">No groups yet</p>
                    <p className="text-xs text-gray-500">
                        Create a group to organize your networks
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {groups.map(group => (
                        <div
                            key={group.id}
                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="font-medium">{group.name}</p>
                                    <p className="text-xs text-gray-600">
                                        {group.networkIds.length} network
                                        {group.networkIds.length !== 1
                                            ? "s"
                                            : ""}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                handleEditGroup(group)
                                            }
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                Edit Network Group
                                            </DialogTitle>
                                            <DialogDescription>
                                                Update group name and networks
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-group-name">
                                                    Group Name
                                                </Label>
                                                <Input
                                                    id="edit-group-name"
                                                    value={groupName}
                                                    onChange={e =>
                                                        setGroupName(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Select Networks</Label>
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {networks.map(network => (
                                                        <div
                                                            key={network.id}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Checkbox
                                                                id={`edit-network-${network.id}`}
                                                                checked={selectedNetworks.includes(
                                                                    network.id
                                                                )}
                                                                onCheckedChange={checked => {
                                                                    if (
                                                                        checked
                                                                    ) {
                                                                        setSelectedNetworks(
                                                                            [
                                                                                ...selectedNetworks,
                                                                                network.id,
                                                                            ]
                                                                        )
                                                                    } else {
                                                                        setSelectedNetworks(
                                                                            selectedNetworks.filter(
                                                                                id =>
                                                                                    id !==
                                                                                    network.id
                                                                            )
                                                                        )
                                                                    }
                                                                }}
                                                            />
                                                            <Label
                                                                htmlFor={`edit-network-${network.id}`}
                                                                className="cursor-pointer capitalize"
                                                            >
                                                                {
                                                                    network.platform
                                                                }
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditingGroupId(null)
                                                        setGroupName("")
                                                        setSelectedNetworks([])
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleUpdateGroup}
                                                    disabled={
                                                        !groupName.trim() ||
                                                        selectedNetworks.length ===
                                                            0
                                                    }
                                                    className="flex-1"
                                                >
                                                    Update
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() =>
                                            setDeleteGroupId(group.id)
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    {deleteGroupId === group.id && (
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Delete Group
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to
                                                    delete "{group.name}"? This
                                                    action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <div className="flex gap-2">
                                                <AlertDialogCancel
                                                    onClick={() =>
                                                        setDeleteGroupId(null)
                                                    }
                                                >
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDeleteGroup}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </div>
                                        </AlertDialogContent>
                                    )}
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
