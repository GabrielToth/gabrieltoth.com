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
import { useTranslations } from "next-intl"
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
    const t = useTranslations("dashboard.settings")
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
                    <h3 className="font-semibold">{t("networkGroups")}</h3>
                    <p className="text-sm text-muted-foreground dark:text-foreground">
                        {t("networkGroupsDescription")}
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            {t("newGroup")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("createGroup")}</DialogTitle>
                            <DialogDescription>
                                {t("createGroupDescription")}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="group-name">
                                    {t("groupName")}
                                </Label>
                                <Input
                                    id="group-name"
                                    placeholder={t("groupNamePlaceholder")}
                                    value={groupName}
                                    onChange={e => setGroupName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t("selectNetworks")}</Label>
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
                                    {t("cancel")}
                                </Button>
                                <Button
                                    onClick={handleCreateGroup}
                                    disabled={
                                        !groupName.trim() ||
                                        selectedNetworks.length === 0
                                    }
                                    className="flex-1"
                                >
                                    {t("create")}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {groups.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-sm text-muted-foreground dark:text-foreground">
                        {t("noGroups")}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {t("createGroupPrompt")}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {groups.map(group => (
                        <div
                            key={group.id}
                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted dark:hover:bg-background/50"
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{group.name}</p>
                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                        {group.networkIds.length}{" "}
                                        {group.networkIds.length !== 1
                                            ? "networks"
                                            : "network"}
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
                                                {t("editGroup")}
                                            </DialogTitle>
                                            <DialogDescription>
                                                {t("editGroupDescription")}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-group-name">
                                                    {t("groupName")}
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
                                                <Label>
                                                    {t("selectNetworks")}
                                                </Label>
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
                                                    {t("cancel")}
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
                                                    {t("update")}
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                                                    {t("deleteGroup")}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t("deleteGroupConfirm", {
                                                        name: group.name,
                                                    })}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <div className="flex gap-2">
                                                <AlertDialogCancel
                                                    onClick={() =>
                                                        setDeleteGroupId(null)
                                                    }
                                                >
                                                    {t("cancel")}
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDeleteGroup}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    {t("delete")}
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
