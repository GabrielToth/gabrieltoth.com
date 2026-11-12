"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { getLocalChannels } from "@/lib/local-projects/storage"
import { publishLocally } from "@/lib/local-projects/publish"
import type { LocalChannelProjectBinding } from "@/lib/local-projects/types"
import {
    inferContentType,
    normalizePlatformKey,
    validateCrossPlatformPublishing,
    type ExecutionEnvironment,
    type PlatformKey,
    type PostContentType,
} from "@/lib/posting/platform-capabilities"
import { AlertCircle, CheckCircle, Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useState } from "react"
import ContentCreator from "./ContentCreator"
import { CrossPlatformCompatibilityBadge } from "./CrossPlatformCompatibilityBadge"
import NetworkSelector from "./NetworkSelector"
import PostingScheduler from "./PostingScheduler"
import StorageModeToggle from "./StorageModeToggle"
import VideoUploader from "./VideoUploader"

interface PostingInterfaceProps {
    onClose: () => void
    defaultDate?: Date
}

interface Network {
    id: string
    platform: string
    status: "connected" | "disconnected" | "expired"
}

interface NetworkStatusItem {
    id?: string
    platform?: string
    name?: string
    status?: string
}

interface NetworkStatusResponse {
    networks?: NetworkStatusItem[]
    error?: string
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

/** Platforms that require video content instead of text */
const VIDEO_REQUIRED_PLATFORMS = new Set(["youtube"])

const LOCAL_NETWORK_PREFIX = "local:"

const exampleNetworks: Network[] = [
    { id: "1", platform: "youtube", status: "connected" },
    { id: "2", platform: "facebook", status: "connected" },
    { id: "3", platform: "instagram", status: "connected" },
    { id: "4", platform: "twitter", status: "expired" },
    { id: "5", platform: "linkedin", status: "disconnected" },
]

function buildLocalNetworks(channels: LocalChannelProjectBinding[]): Network[] {
    return channels.map(channel => ({
        id: `${LOCAL_NETWORK_PREFIX}${channel.platform}:${channel.channelId}`,
        platform: channel.platform,
        status: "connected" as const,
    }))
}

function parseLocalNetworkId(
    networkId: string
): { platform: string; channelId: string } | null {
    if (!networkId.startsWith(LOCAL_NETWORK_PREFIX)) return null
    const rest = networkId.slice(LOCAL_NETWORK_PREFIX.length)
    const separator = rest.indexOf(":")
    if (separator < 0) return null
    return {
        platform: rest.slice(0, separator),
        channelId: rest.slice(separator + 1),
    }
}

export default function PostingInterface({
    onClose,
    defaultDate,
}: PostingInterfaceProps) {
    const [networks, setNetworks] = useState<Network[]>([])
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [groups, setGroups] = useState<NetworkGroup[]>([])
    const [selectedNetworkIds, setSelectedNetworkIds] = useState<string[]>([])
    const [content, setContent] = useState<PostContent>({
        text: "",
        images: [],
        urls: [],
    })
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoDurationSeconds, setVideoDurationSeconds] = useState<
        number | undefined
    >()
    const [schedule, setSchedule] = useState<Schedule>({
        type: defaultDate ? "scheduled" : "immediate",
    })
    const [executionMode, setExecutionMode] =
        useState<ExecutionEnvironment>("cloud")
    const [localChannels, setLocalChannels] = useState<
        LocalChannelProjectBinding[]
    >([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingNetworks, setIsLoadingNetworks] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const t = useTranslations("dashboard.publish")

    useEffect(() => {
        async function loadNetworks() {
            try {
                const res = await fetch("/api/networks/status")
                if (!res.ok) throw new Error("Failed to load networks")
                const data: NetworkStatusResponse = await res.json()

                const mapped: Network[] = (
                    data.networks ||
                    (data as NetworkStatusItem[]) ||
                    []
                ).map((n: NetworkStatusItem, i: number) => ({
                    id: n.id || n.platform || String(i),
                    platform: n.platform || n.name || "",
                    status:
                        n.status === "connected"
                            ? "connected"
                            : n.status === "expired"
                              ? "expired"
                              : "disconnected",
                }))

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

    // LOCAL channels live only in this browser. Nothing here is fetched from
    // or sent to the backend.
    useEffect(() => {
        setLocalChannels(getLocalChannels())
    }, [executionMode])

    // Read the duration locally so the capability matrix can validate limits
    // before any upload happens.
    useEffect(() => {
        if (!videoFile) {
            setVideoDurationSeconds(undefined)
            return
        }

        const objectUrl = URL.createObjectURL(videoFile)
        const element = document.createElement("video")
        element.preload = "metadata"
        element.onloadedmetadata = () => {
            if (Number.isFinite(element.duration)) {
                setVideoDurationSeconds(element.duration)
            }
            URL.revokeObjectURL(objectUrl)
        }
        element.onerror = () => URL.revokeObjectURL(objectUrl)
        element.src = objectUrl
    }, [videoFile])

    const availableNetworks = useMemo(
        () =>
            executionMode === "local"
                ? buildLocalNetworks(localChannels)
                : networks,
        [executionMode, localChannels, networks]
    )

    /** Get the set of selected platform names */
    const selectedPlatforms = selectedNetworkIds
        .map(id => availableNetworks.find(n => n.id === id)?.platform)
        .filter(Boolean) as string[]

    /** Matrix keys for the selected platforms */
    const selectedMatrixPlatforms = useMemo(
        () =>
            selectedPlatforms
                .map(normalizePlatformKey)
                .filter((p): p is PlatformKey => p !== null),
        [selectedPlatforms]
    )

    const contentType: PostContentType = useMemo(
        () =>
            inferContentType({
                hasVideo: Boolean(videoFile),
                hasImages: content.images.length > 0,
                durationSeconds: videoDurationSeconds,
            }),
        [videoFile, content.images.length, videoDurationSeconds]
    )

    /** Whether YouTube is among the selected platforms */
    const hasYouTubeSelected = selectedPlatforms.some(p =>
        VIDEO_REQUIRED_PLATFORMS.has(p)
    )

    const handleModeChange = useCallback((mode: ExecutionEnvironment) => {
        setExecutionMode(mode)
        setSelectedNetworkIds([])
        setError("")
    }, [])

    const handleNetworkToggle = useCallback((networkId: string) => {
        setSelectedNetworkIds(prev =>
            prev.includes(networkId)
                ? prev.filter(id => id !== networkId)
                : [...prev, networkId]
        )
        // Clear previous error on network change
        setError("")
    }, [])

    const handleGroupToggle = useCallback((_groupId: string) => {}, [])

    const handleSelectAll = useCallback(() => {
        setSelectedNetworkIds(
            availableNetworks
                .filter(n => n.status === "connected")
                .map(n => n.id)
        )
    }, [availableNetworks])

    const handleDeselectAll = useCallback(() => {
        setSelectedNetworkIds([])
    }, [])

    const _handlePublish = async () => {
        setError("")
        setSuccess(false)

        // ── Validation ──
        if (selectedNetworkIds.length === 0) {
            setError(t("networkRequired"))
            return
        }

        if (!content.text.trim() && content.images.length === 0 && !videoFile) {
            setError(t("contentRequired"))
            return
        }

        const expiredNetworks = selectedNetworkIds.filter(id => {
            const network = availableNetworks.find(n => n.id === id)
            return network?.status === "expired"
        })

        if (expiredNetworks.length > 0) {
            setError(t("expiredAuth"))
            return
        }

        // Validate video requirement for YouTube
        if (hasYouTubeSelected && !videoFile) {
            setError(
                "YouTube requer um arquivo de vídeo para publicar. Selecione um vídeo na área de upload abaixo."
            )
            return
        }

        // LOCAL publishing is browser-only and cannot be scheduled, because
        // the browser is not running when the schedule fires.
        if (executionMode === "local" && schedule.type === "scheduled") {
            setError(
                "Agendamento exige modo Cloud. No modo Local a publicação acontece apenas agora, direto do seu navegador."
            )
            return
        }

        // Capability matrix gate — same rules for LOCAL and CLOUD.
        if (selectedMatrixPlatforms.length !== selectedPlatforms.length) {
            setError(
                "Uma das redes selecionadas não é suportada pela matriz oficial de capacidades."
            )
            return
        }

        const matrixValidation = validateCrossPlatformPublishing({
            platforms: selectedMatrixPlatforms,
            contentType,
            environment: executionMode,
            characterCount: content.text.length,
            fileSizeBytes: videoFile?.size,
            durationSeconds: videoDurationSeconds,
        })

        if (!matrixValidation.allValid) {
            setError(
                Object.values(matrixValidation.results)
                    .filter(result => !result.isCompatible)
                    .map(
                        result =>
                            `${result.displayName}: ${result.reasons.join(" ")}`
                    )
                    .join("\n")
            )
            return
        }

        // Validate scheduled + YouTube (not supported yet)
        if (
            schedule.type === "scheduled" &&
            schedule.scheduledTime &&
            hasYouTubeSelected
        ) {
            setError(
                "Publicação agendada para o YouTube não é suportada no momento. Publique imediatamente ou remova o YouTube das plataformas selecionadas."
            )
            return
        }

        setIsSubmitting(true)

        try {
            if (executionMode === "local") {
                // ── LOCAL: direct browser calls, zero backend ──
                const errors: string[] = []

                for (const networkId of selectedNetworkIds) {
                    const localTarget = parseLocalNetworkId(networkId)
                    if (!localTarget) {
                        errors.push(
                            `${networkId}: rede LOCAL inválida ou canal não vinculado neste navegador.`
                        )
                        continue
                    }

                    const result = await publishLocally({
                        platform: localTarget.platform,
                        channelId: localTarget.channelId,
                        text: content.text,
                        hasVideo: Boolean(videoFile),
                        hasImages: content.images.length > 0,
                        videoFile: videoFile ?? undefined,
                        durationSeconds: videoDurationSeconds,
                        fileSizeBytes: videoFile?.size,
                        characterCount: content.text.length,
                        contentType,
                    })

                    if (!result.ok) {
                        errors.push(
                            `${localTarget.platform}: ${result.reasons.join(" ")}`
                        )
                    }
                }

                if (errors.length > 0) {
                    throw new Error(
                        "Falha ao publicar em algumas plataformas (LOCAL):\n" +
                            errors.join("\n")
                    )
                }
            } else {
                // ── CLOUD: backend stays the executor ──
                let scheduledTime: number | undefined
                if (schedule.type === "scheduled" && schedule.scheduledTime) {
                    scheduledTime = schedule.scheduledTime.getTime()
                }

                if (schedule.type === "scheduled" && scheduledTime) {
                    // Scheduled post - YouTube not allowed here (validated above)
                    const res = await fetch("/api/posts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            content: content.text,
                            scheduledTime,
                            platforms: selectedPlatforms,
                            mediaType: videoFile ? "video" : "text",
                            contentType,
                            durationSeconds: videoDurationSeconds,
                            fileSizeBytes: videoFile?.size,
                            mode: executionMode,
                        }),
                    })

                    if (!res.ok) {
                        const data = await res.json()
                        throw new Error(data.error || t("failedToSchedule"))
                    }
                } else {
                    // Immediate publish - send to each platform
                    const errors: string[] = []

                    for (const platform of selectedPlatforms) {
                        if (
                            VIDEO_REQUIRED_PLATFORMS.has(platform) &&
                            videoFile
                        ) {
                            // ── YouTube: send multipart with video + description ──
                            const formData = new FormData()
                            formData.append("video", videoFile)
                            formData.append("description", content.text)
                            formData.append("privacyStatus", "unlisted")

                            const res = await fetch(
                                `/api/platform/${platform}/publish`,
                                {
                                    method: "POST",
                                    body: formData,
                                }
                            )

                            if (!res.ok) {
                                const data = await res.json()
                                const errorMsg =
                                    data.message ||
                                    data.error ||
                                    "Unknown error"
                                errors.push(`${platform}: ${errorMsg}`)
                                console.error(
                                    `Failed to publish to ${platform}:`,
                                    data
                                )
                            }
                        } else {
                            // ── Other platforms: send JSON ──
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
                                const errorMsg =
                                    data.message ||
                                    data.error ||
                                    "Unknown error"
                                errors.push(`${platform}: ${errorMsg}`)
                                console.error(
                                    `Failed to publish to ${platform}:`,
                                    data
                                )
                            }
                        }
                    }

                    if (errors.length > 0) {
                        throw new Error(
                            "Falha ao publicar em algumas plataformas:\n" +
                                errors.join("\n")
                        )
                    }
                }
            }

            setSuccess(true)
            setTimeout(() => {
                onClose()
            }, 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : t("failedToPublish"))
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
                            ? t("schedulePost") +
                              " " +
                              defaultDate.toLocaleDateString()
                            : t("universalPosting")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("universalPostingDesc")}
                    </DialogDescription>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                        aria-label={t("close")}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-950/30 dark:text-red-400">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="text-sm whitespace-pre-line">
                                {error}
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-800 dark:bg-green-950/30 dark:text-green-400">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">
                                {schedule.type === "immediate"
                                    ? t("postedSuccessfully")
                                    : t("postScheduled")}
                            </p>
                        </div>
                    )}

                    <StorageModeToggle
                        mode={executionMode}
                        onModeChange={handleModeChange}
                        disabled={isSubmitting}
                    />

                    {isLoadingNetworks ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground dark:text-muted-foreground" />
                        </div>
                    ) : (
                        <NetworkSelector
                            networks={availableNetworks}
                            groups={groups}
                            selectedNetworkIds={selectedNetworkIds}
                            onNetworkToggle={handleNetworkToggle}
                            onGroupToggle={handleGroupToggle}
                            onSelectAll={handleSelectAll}
                            onDeselectAll={handleDeselectAll}
                        />
                    )}

                    {executionMode === "local" &&
                        localChannels.length === 0 && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>
                                    Nenhum canal LOCAL vinculado neste
                                    navegador. As chaves nunca saem daqui.
                                </span>
                            </div>
                        )}

                    <ContentCreator onContentChange={setContent} />

                    {/* Show VideoUploader when YouTube is selected */}
                    {hasYouTubeSelected && (
                        <VideoUploader
                            onFileSelect={setVideoFile}
                            selectedPlatforms={selectedPlatforms.filter(p =>
                                VIDEO_REQUIRED_PLATFORMS.has(p)
                            )}
                            disabled={isSubmitting}
                        />
                    )}

                    <CrossPlatformCompatibilityBadge
                        platforms={selectedMatrixPlatforms}
                        contentType={contentType}
                        environment={executionMode}
                        characterCount={content.text.length}
                        fileSizeBytes={videoFile?.size}
                        durationSeconds={videoDurationSeconds}
                    />

                    <PostingScheduler
                        onScheduleChange={setSchedule}
                        defaultDate={defaultDate}
                    />

                    <div className="flex gap-2 border-t pt-4 dark:border-border">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={_handlePublish}
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
