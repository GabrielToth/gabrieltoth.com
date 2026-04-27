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
import { useCallback, useState } from "react"
import ContentCreator from "./ContentCreator"
import NetworkSelector from "./NetworkSelector"
import PostingScheduler from "./PostingScheduler"

interface PostingInterfaceProps {
    onClose: () => void
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
    type: "immediate" | "scheduled" | "recurring"
    scheduledTime?: Date
    timezone?: string
    recurrence?: "daily" | "weekly" | "monthly"
}

export default function PostingInterface({ onClose }: PostingInterfaceProps) {
    const [selectedNetworkIds, setSelectedNetworkIds] = useState<string[]>([])
    const [content, setContent] = useState<PostContent>({
        text: "",
        images: [],
        urls: [],
    })
    const [schedule, setSchedule] = useState<Schedule>({ type: "immediate" })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    // Mock data - replace with actual API calls
    const networks: Network[] = [
        { id: "1", platform: "youtube", status: "connected" },
        { id: "2", platform: "facebook", status: "connected" },
        { id: "3", platform: "instagram", status: "connected" },
        { id: "4", platform: "twitter", status: "expired" },
        { id: "5", platform: "linkedin", status: "disconnected" },
    ]

    const groups: NetworkGroup[] = [
        { id: "g1", name: "Social Media", networkIds: ["1", "2", "3"] },
        { id: "g2", name: "Professional", networkIds: ["5"] },
    ]

    const handleNetworkToggle = useCallback((networkId: string) => {
        setSelectedNetworkIds(prev =>
            prev.includes(networkId)
                ? prev.filter(id => id !== networkId)
                : [...prev, networkId]
        )
    }, [])

    const handleGroupToggle = useCallback(
        (groupId: string) => {
            const group = groups.find(g => g.id === groupId)
            if (!group) return

            const allSelected = group.networkIds.every(id =>
                selectedNetworkIds.includes(id)
            )

            if (allSelected) {
                setSelectedNetworkIds(prev =>
                    prev.filter(id => !group.networkIds.includes(id))
                )
            } else {
                setSelectedNetworkIds(prev => [
                    ...new Set([...prev, ...group.networkIds]),
                ])
            }
        },
        [selectedNetworkIds, groups]
    )

    const handleSelectAll = useCallback(() => {
        setSelectedNetworkIds(networks.map(n => n.id))
    }, [networks])

    const handleDeselectAll = useCallback(() => {
        setSelectedNetworkIds([])
    }, [])

    const handlePublish = async () => {
        setError("")
        setSuccess(false)

        // Validation
        if (selectedNetworkIds.length === 0) {
            setError("Please select at least one network")
            return
        }

        if (!content.text.trim() && content.images.length === 0) {
            setError("Please add content (text or images)")
            return
        }

        // Check for expired networks
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

        setIsLoading(true)

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            setSuccess(true)
            setTimeout(() => {
                onClose()
            }, 2000)
        } catch (err) {
            setError("Failed to publish. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Universal Posting</DialogTitle>
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

                    <NetworkSelector
                        networks={networks}
                        groups={groups}
                        selectedNetworkIds={selectedNetworkIds}
                        onNetworkToggle={handleNetworkToggle}
                        onGroupToggle={handleGroupToggle}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                    />

                    <ContentCreator onContentChange={setContent} />

                    <PostingScheduler onScheduleChange={setSchedule} />

                    <div className="flex gap-2 border-t pt-4">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePublish}
                            disabled={
                                isLoading || selectedNetworkIds.length === 0
                            }
                            className="flex-1"
                        >
                            {isLoading && (
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
