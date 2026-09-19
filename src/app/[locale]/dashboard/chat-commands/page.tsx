"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, Edit3 } from "lucide-react"
import React, { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

interface ChatCommand {
    id?: string
    trigger: string
    type: "response" | "stream_update" | "moderation" | "system"
    responseTemplate?: string
    description?: string
    platforms?: string[]
    allowedRoles?: string[]
    cooldownSeconds?: number
    enabled?: boolean
}

const PLATFORM_OPTIONS = [
    { value: "twitch", label: "Twitch" },
    { value: "kick", label: "Kick" },
    { value: "youtube", label: "YouTube" },
]

const ROLE_OPTIONS = [
    { value: "broadcaster", label: "Broadcaster" },
    { value: "moderator", label: "Moderator" },
    { value: "subscriber", label: "Subscriber" },
    { value: "viewer", label: "Viewer" },
]

export default function ChatCommandsPage() {
    const t = useTranslations("dashboard.chatCommands")
    const [commands, setCommands] = useState<ChatCommand[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editing, setEditing] = useState<ChatCommand | null>(null)
    const [showDialog, setShowDialog] = useState(false)

    useEffect(() => {
        fetchCommands()
    }, [])

    async function fetchCommands() {
        try {
            const res = await fetch("/api/chat-commands")
            if (res.ok) {
                const data = await res.json()
                setCommands(data.commands || data.data || [])
            }
        } catch (_err) {
            console.error(_err)
            alert("Failed to load commands")
        } finally {
            setIsLoading(false)
        }
    }

    async function createOrUpdateCommand(cmd: ChatCommand) {
        try {
            const res = await fetch("/api/chat-commands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cmd),
            })

            if (res.ok) {
                alert(cmd.id ? "Command updated" : "Command created")
                setShowDialog(false)
                setEditing(null)
                await fetchCommands()
            } else {
                const err = await res.json()
                alert(err.error || "Failed to save command")
            }
        } catch (_err) {
            alert("Request failed")
        }
    }

    async function deleteCommand(id: string) {
        if (!confirm("Delete this command?")) return

        try {
            const res = await fetch(`/api/chat-commands?id=${id}`, {
                method: "DELETE",
            })

            if (res.ok) {
                alert("Command deleted")
                await fetchCommands()
            }
        } catch (_err) {
            alert("Failed to delete command")
        }
    }

    const isDefault = (id?: string) => id?.startsWith("default:")

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("description")}</p>
                </div>
                <Button
                    onClick={() => {
                        setEditing({
                            trigger: "",
                            type: "response",
                            platforms: [],
                            allowedRoles: ["viewer"],
                            cooldownSeconds: 10,
                            enabled: true,
                        })
                        setShowDialog(true)
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("addCommand")}
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="grid gap-6">
                    {commands.length === 0 && (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">
                                    {t("noCommands")}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {commands.map(cmd => (
                        <Card key={cmd.id}>
                            <CardHeader className="flex flex-row items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle>
                                        {cmd.trigger}
                                        {isDefault(cmd.id) && (
                                            <Badge
                                                variant="outline"
                                                className="ml-2"
                                            >
                                                {t("default")}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {cmd.description ||
                                            cmd.responseTemplate?.substring(
                                                0,
                                                60
                                            )}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{cmd.type}</Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setEditing(cmd)
                                            setShowDialog(true)
                                        }}
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                    {!isDefault(cmd.id) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                deleteCommand(cmd.id!)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary">
                                        {t("platforms")}:{" "}
                                        {(cmd.platforms || []).join(", ") ||
                                            PLATFORM_OPTIONS.map(
                                                p => p.value
                                            ).join(", ")}
                                    </Badge>
                                    <Badge variant="secondary">
                                        {t("roles")}:{" "}
                                        {(cmd.allowedRoles || []).join(", ") ||
                                            "viewer"}
                                    </Badge>
                                    <Badge variant="secondary">
                                        {t("cooldown")}:{" "}
                                        {cmd.cooldownSeconds || 10}s
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Command Editor Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <Card className="w-full max-w-2xl mx-4">
                        <CardHeader>
                            <CardTitle>
                                {editing?.id
                                    ? t("editCommand")
                                    : t("newCommand")}
                            </CardTitle>
                            <CardDescription>
                                {editing?.id
                                    ? t("editCommandDesc")
                                    : t("newCommandDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="trigger">{t("trigger")}</Label>
                                <Input
                                    id="trigger"
                                    placeholder="!discord"
                                    value={editing?.trigger || ""}
                                    onChange={e =>
                                        setEditing({
                                            ...editing!,
                                            trigger: e.target.value,
                                        })
                                    }
                                    disabled={!!isDefault(editing?.id)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">{t("type")}</Label>
                                <Select
                                    value={editing?.type || "response"}
                                    onValueChange={v =>
                                        setEditing({
                                            ...editing!,
                                            type: v as ChatCommand["type"],
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="response">
                                            {t("typeResponse")}
                                        </SelectItem>
                                        <SelectItem value="stream_update">
                                            {t("typeStreamUpdate")}
                                        </SelectItem>
                                        <SelectItem value="moderation">
                                            {t("typeModeration")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {editing?.type === "response" && (
                                <div className="space-y-2">
                                    <Label htmlFor="response">
                                        {t("response")}
                                    </Label>
                                    <Textarea
                                        id="response"
                                        placeholder="Hello {user}! The stream title is: {title}"
                                        value={editing?.responseTemplate || ""}
                                        onChange={e =>
                                            setEditing({
                                                ...editing!,
                                                responseTemplate:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}

                            {editing?.type === "stream_update" && (
                                <div className="space-y-2">
                                    <Label htmlFor="updateTitle">
                                        {t("type") === "stream_update"
                                            ? "Update Title"
                                            : "Title Update"}
                                    </Label>
                                    <Input
                                        id="updateTitle"
                                        placeholder="Stream title or leave empty for category"
                                        value={editing?.responseTemplate || ""}
                                        onChange={e =>
                                            setEditing({
                                                ...editing!,
                                                responseTemplate:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>{t("platforms")}</Label>
                                <div className="flex flex-wrap gap-2">
                                    {PLATFORM_OPTIONS.map(p => (
                                        <Label
                                            key={p.value}
                                            className="flex items-center space-x-2"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={(
                                                    editing?.platforms || []
                                                ).includes(p.value)}
                                                onChange={e => {
                                                    const platforms =
                                                        editing?.platforms || []
                                                    const newPlatforms = e
                                                        .target.checked
                                                        ? [
                                                              ...new Set([
                                                                  ...platforms,
                                                                  p.value,
                                                              ]),
                                                          ]
                                                        : platforms.filter(
                                                              pl =>
                                                                  pl !== p.value
                                                          )
                                                    setEditing({
                                                        ...editing!,
                                                        platforms: newPlatforms,
                                                    })
                                                }}
                                            />
                                            <span>{p.label}</span>
                                        </Label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{t("allowedRoles")}</Label>
                                <div className="flex flex-wrap gap-2">
                                    {ROLE_OPTIONS.map(r => (
                                        <Label
                                            key={r.value}
                                            className="flex items-center space-x-2"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={(
                                                    editing?.allowedRoles || []
                                                ).includes(r.value)}
                                                onChange={e => {
                                                    const roles =
                                                        editing?.allowedRoles ||
                                                        []
                                                    const newRoles = e.target
                                                        .checked
                                                        ? [
                                                              ...new Set([
                                                                  ...roles,
                                                                  r.value,
                                                              ]),
                                                          ]
                                                        : roles.filter(
                                                              role =>
                                                                  role !==
                                                                  r.value
                                                          )
                                                    setEditing({
                                                        ...editing!,
                                                        allowedRoles: newRoles,
                                                    })
                                                }}
                                            />
                                            <span>{r.label}</span>
                                        </Label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cooldown">
                                    {t("cooldown")}
                                </Label>
                                <Input
                                    id="cooldown"
                                    type="number"
                                    min={0}
                                    value={editing?.cooldownSeconds || 10}
                                    onChange={e =>
                                        setEditing({
                                            ...editing!,
                                            cooldownSeconds:
                                                parseInt(e.target.value) || 10,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="enabled"
                                    checked={editing?.enabled !== false}
                                    onChange={e =>
                                        setEditing({
                                            ...editing!,
                                            enabled: e.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="enabled">{t("enabled")}</Label>
                            </div>
                        </CardContent>

                        <CardContent className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowDialog(false)
                                    setEditing(null)
                                }}
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                onClick={() => createOrUpdateCommand(editing!)}
                            >
                                {t("save")}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
