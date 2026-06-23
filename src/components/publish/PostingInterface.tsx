"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Loader2, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import ContentCreator from "./ContentCreator"
import NetworkSelector from "./NetworkSelector"
import PostingScheduler from "./PostingScheduler"

interface PostingInterfaceProps {
    onClose: () => void
    defaultDate?: Date
}

interface Network {
    id: string
    platform: string
    status: "connected" | "disconnected" | "expired"
}

interface NetworkGroup {
    id: string
    name: string
    networkIds: string[]
}

interface PostContent {
    text: string
    images: File[]
    urls: string[]
    draft?: boolean
}

interface Schedule {
    type: "immediate" | "scheduled"
    scheduledTime?: Date
    timezone?: string
}

export default function PostingInterface({
    onClose,
    defaultDate,
}: PostingInterfaceProps) {
    const [networks, setNetworks] = useState<Network[]>([])
    const [groups, setGroups] = useState<NetworkGroup[]>([])
    const [selectedNetworkIds, setSelectedNetworkIds] = useState<string[]>([])
    const [content, setContent] = useState<PostContent>({
        text: "",
        images: [],
        urls: [],
    })
    const [schedule, setSchedule] = useState<Schedule>({
        type: defaultDate ? "scheduled" : "immediate",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingNetworks, setIsLoadingNetworks] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        async function loadNetworks() {
            try {
                const res = await fetch("/api/networks/status")
                if (!res.ok) throw new Error("Failed to load networks")
                const data = await res.json()

                const mapped: Network[] = (data.networks || data || []).map(
                    (n: any, i: number) => ({
                        id: n.id || n.platform || String(i),
                        platform: n.platform || n.name,
                        status:
                            n.status === "connected"
                                ? "connected"
                                : n.status === "expired"
                                  ? "expired"
                                  : "disconnected",
                    })
                )

                if (mapped.length === 0) {
                    setNetworks(exampleNetworks)
                } else {
                    setNetworks(mapped)
                }
            } catch {
                setNetworks(exampleNetworks)
            } finally {
                setIsLoadingNetworks(false)
            }
        }
        loadNetworks()
    }, [])

    const exampleNetworks: Network[] = [
        { id: "1", platform: "youtube", status: "connected" },
        { id: "2", platform: "facebook", status: "connected" },
        { id: "3", platform: "instagram", status: "connected" },
        { id: "4", platform: "twitter", status: "expired" },
        { id: "5", platform: "linkedin", status: "disconnected" },
    ]

    const handleNetworkToggle = useCallback((networkId: string) => {
        setSelectedNetworkIds(prev =>
            prev.includes(networkId)
                ? prev.filter(id => id !== networkId)
                : [...prev, networkId]
        )
    }, [])

    const handleGroupToggle = useCallback((_groupId: string) => {}, [])

    const handleSelectAll = useCallback(() => {
        setSelectedNetworkIds(
            networks.filter(n => n.status === "connected").map(n => n.id)
        )
    }, [networks])

    const handleDeselectAll = useCallback(() => {
        setSelectedNetworkIds([])
    }, [])

    const handlePublish = async () => {
        setError("")
        setSuccess(false)

        if (selectedNetworkIds.length === 0) {
            setError("Please select at least one network")
            return
        }

        if (!content.text.trim() && content.images.length === 0) {
            setError("Please add content (text or images)")
            return
        }

        const expiredNetworks = selectedNetworkIds.filter(id => {
            const network = networks.find(n => n.id === id)
            return network?.status === "expired"
        })

        if (expiredNetworks.length > 0) {
            setError(
                "Some selected networks have expired authentication. Please reconnect them."
            )
            return
        }

        setIsSubmitting(true)

        try {
            const selectedPlatforms = selectedNetworkIds
                .map(id => networks.find(n => n.id === id)?.platform)
                .filter(Boolean) as string[]

            let scheduledTime: number | undefined
            if (schedule.type === "scheduled" && schedule.scheduledTime) {
                scheduledTime = schedule.scheduledTime.getTime()
            }

            if (schedule.type === "scheduled" && scheduledTime) {
                const res = await fetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: content.text,
                        scheduledTime,
                        platforms: selectedPlatforms,
                        mediaType: "text",
                    }),
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "Failed to schedule post")
                }
            } else {
                // Immediate publish - send to each platform's publish endpoint
                await Promise.all(
                    selectedPlatforms.map(async platform => {
                        const res = await fetch(
                            `/api/platform/${platform}/publish`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    message: content.text,
                                }),
                            }
                        )
                        if (!res.ok) {
                            const data = await res.json()
                            console.error(
                                `Failed to publish to ${platform}:`,
                                data
                            )
                        }
                    })
                )
            }

            setSuccess(true)
            setTimeout(() => {
                onClose()
            }, 2000)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to publish. Please try again."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {defaultDate
                            ? `Schedule Post for ${defaultDate.toLocaleDateString()}`
                            : "Universal Posting"}
                    </DialogTitle>
                    <DialogDescription>
                        Create and schedule content across multiple networks
                    </DialogDescription>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-800">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-800">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">
                                {schedule.type === "immediate"
                                    ? "Posted successfully!"
                                    : "Post scheduled successfully!"}
                            </p>
                        </div>
                    )}

                    {isLoadingNetworks ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <NetworkSelector
                            networks={networks}
                            groups={groups}
                            selectedNetworkIds={selectedNetworkIds}
                            onNetworkToggle={handleNetworkToggle}
                            onGroupToggle={handleGroupToggle}
                            onSelectAll={handleSelectAll}
                            onDeselectAll={handleDeselectAll}
                        />
                    )}

                    <ContentCreator onContentChange={setContent} />

                    <PostingScheduler
                        onScheduleChange={setSchedule}
                        defaultDate={defaultDate}
                    />

                    <div className="flex gap-2 border-t pt-4">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePublish}
                            disabled={
                                isSubmitting || selectedNetworkIds.length === 0
                            }
                            className="flex-1"
                        >
                            {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {schedule.type === "immediate"
                                ? "Publish Now"
                                : "Schedule Post"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
