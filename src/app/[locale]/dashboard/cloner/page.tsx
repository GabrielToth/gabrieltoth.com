"use client"

import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"
import { TutorialLauncher } from "@/components/tutorial/tutorial-launcher"
import {
    Search,
    Film,
    Tv,
    Radio,
    Mic,
    CheckSquare,
    Square,
    Play,
    Sparkles,
    Clock,
    AlertCircle,
    Download,
    RefreshCw,
} from "lucide-react"
import {
    InspectChannelResult,
    InspectVideoItem,
} from "@/app/api/cloner/inspect/route"
import {
    ExecutionModeSwitch,
    ExecutionMode,
} from "@/components/ui/execution-mode-switch"

interface ChannelGroup {
    id: string
    name: string
}

interface CloneJob {
    id: string
    source_channel_url: string
    channel_title?: string
    channel_avatar?: string
    target_group_id: string | null
    execution_mode: "cloud" | "local"
    status: "draft" | "in_progress" | "completed" | "error"
    categories: string[]
    schedule_type: "immediate" | "daily" | "weekly"
    schedule_value: number
    total_videos: number
    processed_videos: number
    progress_percentage: number
    estimated_time_remaining: string
    current_step: string
    credit_cost: number
    created_at: string
}

export default function ClonerPage() {
    const _t = useTranslations("dashboard.cloner")
    const [groups, setGroups] = useState<ChannelGroup[]>([])
    const [jobs, setJobs] = useState<CloneJob[]>([])
    const [loadingJobs, setLoadingJobs] = useState(true)

    // Wizard Step State
    const [step, setStep] = useState<"search" | "configure" | "progress">(
        "search"
    )
    const [urlInput, setUrlInput] = useState("")
    const [inspecting, setInspecting] = useState(false)
    const [inspectedChannel, setInspectedChannel] =
        useState<InspectChannelResult | null>(null)

    // Config Step Form State
    const [executionMode, setExecutionMode] = useState<ExecutionMode>("cloud")
    const [customApiKey, setCustomApiKey] = useState("")
    const [targetGroupId, setTargetGroupId] = useState("")
    const [scheduleType, setScheduleType] = useState<
        "immediate" | "daily" | "weekly"
    >("daily")
    const [scheduleValue, setScheduleValue] = useState<number>(1) // e.g. 1 video per day
    const [autoUpdate, setAutoUpdate] = useState<boolean>(true)

    // Selected Content Category Tabs & Selection Sets
    const [activeTab, setActiveTab] = useState<
        "videos" | "shorts" | "lives" | "podcasts"
    >("videos")
    const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(
        new Set()
    )

    // Active Job Being Tracked
    const [currentJob, setCurrentJob] = useState<CloneJob | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const fetchInitialData = useCallback(async () => {
        try {
            const [gRes, jRes] = await Promise.all([
                fetch("/api/channel-groups"),
                fetch("/api/clone-jobs"),
            ])
            if (gRes.ok) {
                const data = await gRes.json()
                if (data.success) setGroups(data.data || [])
            }
            if (jRes.ok) {
                const data = await jRes.json()
                if (data.success) setJobs(data.data || [])
            }
        } catch {
            // Silently handle error
        } finally {
            setLoadingJobs(false)
        }
    }, [])

    useEffect(() => {
        fetchInitialData()
    }, [fetchInitialData])

    // Live polling for jobs progress
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch("/api/clone-jobs")
                if (res.ok) {
                    const data = await res.json()
                    if (data.success) {
                        setJobs(data.data || [])
                        if (currentJob) {
                            const updated = (data.data || []).find(
                                (j: CloneJob) => j.id === currentJob.id
                            )
                            if (updated) setCurrentJob(updated)
                        }
                    }
                }
            } catch {
                // Silently handle error
            }
        }, 3000)
        return () => clearInterval(interval)
    }, [currentJob])

    // Step 1: Inspect Channel
    const handleInspect = async () => {
        if (!urlInput.trim()) return
        setInspecting(true)
        setErrorMsg(null)

        try {
            const res = await fetch("/api/cloner/inspect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: urlInput.trim(),
                    mode: executionMode,
                    customApiKey: customApiKey.trim() || undefined,
                }),
            })
            const data = await res.json()
            if (data.success && data.data) {
                setInspectedChannel(data.data)
                // Select all video IDs by default across categories
                const allIds = new Set<string>()
                Object.values(
                    data.data.categories as Record<string, InspectVideoItem[]>
                ).forEach(list => {
                    list.forEach(item => allIds.add(item.id))
                })
                setSelectedVideoIds(allIds)
                setStep("configure")
            } else {
                setErrorMsg(
                    data.error ||
                        "Não foi possível resolver informações do canal do YouTube."
                )
            }
        } catch (err) {
            setErrorMsg(
                err instanceof Error
                    ? err.message
                    : "Erro ao conectar com API de busca de canais."
            )
        } finally {
            setInspecting(false)
        }
    }

    // Toggle Selection of Videos
    const toggleVideoSelection = (id: string) => {
        setSelectedVideoIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleCategorySelection = (catList: InspectVideoItem[]) => {
        const catIds = catList.map(v => v.id)
        const allSelected = catIds.every(id => selectedVideoIds.has(id))

        setSelectedVideoIds(prev => {
            const next = new Set(prev)
            if (allSelected) {
                catIds.forEach(id => next.delete(id))
            } else {
                catIds.forEach(id => next.add(id))
            }
            return next
        })
    }

    // Calculate Estimated Costs & Duration
    const selectedVideosList = inspectedChannel
        ? Object.values(inspectedChannel.categories)
              .flat()
              .filter(v => selectedVideoIds.has(v.id))
        : []

    const totalDurationMinutes = Math.ceil(
        selectedVideosList.reduce((acc, v) => acc + v.durationSeconds, 0) / 60
    )

    // Formula: 100 credits per minute of video download in Cloud Mode
    const estimatedCreditCost =
        executionMode === "cloud" ? totalDurationMinutes * 100 : 0

    // Step 2: Start Clone Job
    const handleStartCloning = async () => {
        if (!inspectedChannel || selectedVideoIds.size === 0) return
        setSubmitting(true)
        setErrorMsg(null)

        try {
            const res = await fetch("/api/clone-jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_channel_url: urlInput || inspectedChannel.handle,
                    channel_title: inspectedChannel.title,
                    channel_avatar: inspectedChannel.avatarUrl,
                    target_group_id: targetGroupId || null,
                    execution_mode: executionMode,
                    video_ids: Array.from(selectedVideoIds),
                    categories: [activeTab],
                    schedule_type: scheduleType,
                    schedule_value: scheduleValue,
                    auto_update: autoUpdate,
                    credit_cost: estimatedCreditCost,
                }),
            })

            const data = await res.json()
            if (data.success && data.data) {
                setCurrentJob(data.data)
                setStep("progress")
                fetchInitialData()
            } else {
                setErrorMsg(
                    data.error || "Falha ao iniciar trabalho de clonagem."
                )
            }
        } catch (err) {
            setErrorMsg(
                err instanceof Error
                    ? err.message
                    : "Erro de comunicação ao criar clonagem."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        YouTube Cloner & Auto-Publisher
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Clone canais completos do YouTube com download
                        automático, divisão por categorias e agendamento de
                        postagens.
                    </p>
                </div>
                <TutorialLauncher category="cloner" />
            </div>

            {errorMsg && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* STEP 1: CHANNEL INSPECT & SEARCH */}
            {step === "search" && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="max-w-xl space-y-1">
                            <h2 className="text-base font-semibold text-neutral-200">
                                1. Identificar Canal do YouTube
                            </h2>
                            <p className="text-xs text-neutral-400">
                                Digite a URL completa do canal ou o arroba (ex:{" "}
                                <span className="font-mono text-primary">
                                    https://www.youtube.com/@Maple-Circuit
                                </span>{" "}
                                ou{" "}
                                <span className="font-mono text-primary">
                                    @Maple-Circuit
                                </span>
                                ):
                            </p>
                        </div>
                        <ExecutionModeSwitch
                            mode={executionMode}
                            onChange={setExecutionMode}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                placeholder="Cole a URL ou @do_canal..."
                                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-primary focus:outline-none"
                                onKeyDown={e =>
                                    e.key === "Enter" && handleInspect()
                                }
                            />
                        </div>
                        <button
                            onClick={handleInspect}
                            disabled={inspecting || !urlInput.trim()}
                            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {inspecting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    <span>Analisando...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    <span>Analisar Canal</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs text-neutral-400">
                        <input
                            type="text"
                            placeholder="Chave de API do Google própria (opcional para zerar custos de consulta)..."
                            value={customApiKey}
                            onChange={e => setCustomApiKey(e.target.value)}
                            className="w-full max-w-lg rounded border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>
            )}

            {/* STEP 2: CONFIGURE CLONE OPTIONS, CATEGORIES & FREQUENCY */}
            {step === "configure" && inspectedChannel && (
                <div className="space-y-6">
                    {/* Inspected Channel Summary Header */}
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {inspectedChannel.avatarUrl ? (
                                <img
                                    src={inspectedChannel.avatarUrl}
                                    alt={inspectedChannel.title}
                                    className="h-12 w-12 rounded-full object-cover border border-neutral-700"
                                />
                            ) : (
                                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    YT
                                </div>
                            )}
                            <div>
                                <h2 className="text-base font-bold text-neutral-100">
                                    {inspectedChannel.title}
                                </h2>
                                <p className="text-xs text-neutral-400">
                                    {inspectedChannel.handle} ·{" "}
                                    {inspectedChannel.subscriberCountFormatted}{" "}
                                    inscritos ·{" "}
                                    {inspectedChannel.totalVideosCount}{" "}
                                    conteúdos encontrados
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ExecutionModeSwitch
                                mode={executionMode}
                                onChange={setExecutionMode}
                            />
                            <button
                                onClick={() => setStep("search")}
                                className="text-xs text-neutral-400 hover:text-neutral-200 underline"
                            >
                                Trocar Canal
                            </button>
                        </div>
                    </div>

                    {/* Target Group & Publishing Schedule Settings */}
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
                        <h3 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-2">
                            2. Configurações de Destino e Frequência de Postagem
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div>
                                <label className="block font-medium text-neutral-300 mb-1">
                                    Grupo de Canais de Destino
                                </label>
                                <select
                                    value={targetGroupId}
                                    onChange={e =>
                                        setTargetGroupId(e.target.value)
                                    }
                                    className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-200 focus:outline-none focus:border-primary"
                                >
                                    <option value="">
                                        Selecione o grupo para repostar...
                                    </option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-medium text-neutral-300 mb-1">
                                    Frequência de Postagem
                                </label>
                                <select
                                    value={scheduleType}
                                    onChange={e =>
                                        setScheduleType(
                                            e.target.value as
                                                "immediate" | "daily" | "weekly"
                                        )
                                    }
                                    className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-200 focus:outline-none focus:border-primary"
                                >
                                    <option value="immediate">
                                        Imediato (Tudo de uma vez)
                                    </option>
                                    <option value="daily">
                                        Diário (Programado)
                                    </option>
                                    <option value="weekly">
                                        Semanal (Programado)
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-medium text-neutral-300 mb-1">
                                    Quantidade de Vídeos por Intervalo
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={scheduleValue}
                                    onChange={e =>
                                        setScheduleValue(
                                            parseInt(e.target.value, 10) || 1
                                        )
                                    }
                                    className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-200 focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 text-xs pt-1">
                            <input
                                type="checkbox"
                                id="autoUpdate"
                                checked={autoUpdate}
                                onChange={e => setAutoUpdate(e.target.checked)}
                                className="rounded border-neutral-700 bg-neutral-950 text-primary focus:ring-0"
                            />
                            <label
                                htmlFor="autoUpdate"
                                className="text-neutral-300 cursor-pointer"
                            >
                                Clonar novos conteúdos automaticamente assim que
                                forem lançados no canal
                            </label>
                        </div>
                    </div>

                    {/* Categorized Content Selection Tabs */}
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-1 font-semibold text-sm text-neutral-200">
                                <span>
                                    3. Seleção de Conteúdo por Categoria
                                </span>
                                <span className="text-xs text-neutral-400 font-mono">
                                    ({selectedVideoIds.size} selecionados)
                                </span>
                            </div>

                            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
                                <button
                                    onClick={() => setActiveTab("videos")}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                                        activeTab === "videos"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-neutral-400 hover:text-neutral-200"
                                    }`}
                                >
                                    <Film className="h-3.5 w-3.5" />
                                    <span>
                                        Vídeos (
                                        {
                                            inspectedChannel.categories.videos
                                                .length
                                        }
                                        )
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("shorts")}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                                        activeTab === "shorts"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-neutral-400 hover:text-neutral-200"
                                    }`}
                                >
                                    <Tv className="h-3.5 w-3.5" />
                                    <span>
                                        Shorts (
                                        {
                                            inspectedChannel.categories.shorts
                                                .length
                                        }
                                        )
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("lives")}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                                        activeTab === "lives"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-neutral-400 hover:text-neutral-200"
                                    }`}
                                >
                                    <Radio className="h-3.5 w-3.5" />
                                    <span>
                                        Lives (
                                        {
                                            inspectedChannel.categories.lives
                                                .length
                                        }
                                        )
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("podcasts")}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                                        activeTab === "podcasts"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-neutral-400 hover:text-neutral-200"
                                    }`}
                                >
                                    <Mic className="h-3.5 w-3.5" />
                                    <span>
                                        Podcasts (
                                        {
                                            inspectedChannel.categories.podcasts
                                                .length
                                        }
                                        )
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Category Content List */}
                        {(() => {
                            const list = inspectedChannel.categories[activeTab]
                            const allSelected =
                                list.length > 0 &&
                                list.every(item =>
                                    selectedVideoIds.has(item.id)
                                )

                            if (list.length === 0) {
                                return (
                                    <div className="p-8 text-center text-xs text-neutral-500">
                                        Nenhum conteúdo encontrado nesta
                                        categoria.
                                    </div>
                                )
                            }

                            return (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-neutral-400 px-2 py-1 bg-neutral-950/40 rounded border border-neutral-800">
                                        <button
                                            onClick={() =>
                                                toggleCategorySelection(list)
                                            }
                                            className="flex items-center gap-2 hover:text-neutral-200 font-medium"
                                        >
                                            {allSelected ? (
                                                <CheckSquare className="h-4 w-4 text-primary" />
                                            ) : (
                                                <Square className="h-4 w-4" />
                                            )}
                                            <span>
                                                {allSelected
                                                    ? "Desmarcar todos desta aba"
                                                    : "Marcar todos desta aba"}
                                            </span>
                                        </button>
                                        <span className="font-mono">
                                            {list.length} itens
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                                        {list.map(v => {
                                            const isSelected =
                                                selectedVideoIds.has(v.id)
                                            return (
                                                <div
                                                    key={v.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() =>
                                                        toggleVideoSelection(
                                                            v.id
                                                        )
                                                    }
                                                    onKeyDown={e => {
                                                        if (
                                                            e.key === "Enter" ||
                                                            e.key === " "
                                                        ) {
                                                            e.preventDefault()
                                                            toggleVideoSelection(
                                                                v.id
                                                            )
                                                        }
                                                    }}
                                                    className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? "border-primary/50 bg-primary/5 text-neutral-200"
                                                            : "border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700"
                                                    }`}
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                                                    ) : (
                                                        <Square className="h-4 w-4 shrink-0" />
                                                    )}
                                                    {v.thumbnailUrl ? (
                                                        <img
                                                            src={v.thumbnailUrl}
                                                            alt={v.title}
                                                            className="h-10 w-16 object-cover rounded shrink-0 bg-neutral-800"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-16 bg-neutral-800 rounded flex items-center justify-center shrink-0">
                                                            <Play className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-medium truncate text-neutral-200">
                                                            {v.title}
                                                        </p>
                                                        <p className="text-[10px] text-neutral-500 font-mono">
                                                            Duração:{" "}
                                                            {
                                                                v.durationFormatted
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })()}
                    </div>

                    {/* Summary Footer & Action Button */}
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs space-y-1">
                            <p className="font-semibold text-neutral-200">
                                Total Selecionado:{" "}
                                <span className="text-primary font-mono font-bold">
                                    {selectedVideoIds.size} conteúdos
                                </span>{" "}
                                (~{totalDurationMinutes} min de vídeo)
                            </p>
                            <p className="text-neutral-400">
                                Custo Estimado:{" "}
                                {executionMode === "cloud" ? (
                                    <span className="font-mono font-bold text-amber-500">
                                        {estimatedCreditCost.toLocaleString()}{" "}
                                        Créditos (Cloud Mode)
                                    </span>
                                ) : (
                                    <span className="font-mono font-bold text-emerald-400">
                                        0 Créditos (Local Mode)
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setStep("search")}
                                className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleStartCloning}
                                disabled={
                                    submitting || selectedVideoIds.size === 0
                                }
                                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        <span>Iniciando Clonagem...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span>
                                            Confirmar & Iniciar Clonagem
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: LIVE PROGRESS TRACKING & JOB STATUS */}
            {(step === "progress" || jobs.length > 0) && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                        <h3 className="text-sm font-semibold text-neutral-200">
                            Progresso dos Trabalhos de Clonagem
                        </h3>
                        <button
                            onClick={() => setStep("search")}
                            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-lg font-medium hover:bg-primary/90"
                        >
                            + Clonar Novo Canal
                        </button>
                    </div>

                    {loadingJobs ? (
                        <div className="p-8 text-center text-xs text-neutral-500">
                            Carregando trabalhos...
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="p-8 text-center text-xs text-neutral-500">
                            Nenhum trabalho de clonagem em andamento.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {jobs.map(job => (
                                <div
                                    key={job.id}
                                    className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-3">
                                            {job.channel_avatar ? (
                                                <img
                                                    src={job.channel_avatar}
                                                    alt={job.channel_title}
                                                    className="h-8 w-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                                                    YT
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs font-semibold text-neutral-200">
                                                    {job.channel_title ||
                                                        job.source_channel_url}
                                                </p>
                                                <p className="text-[10px] text-neutral-500 font-mono">
                                                    ID: {job.id}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                                    job.execution_mode ===
                                                    "cloud"
                                                        ? "bg-primary/20 text-primary"
                                                        : "bg-emerald-500/20 text-emerald-400"
                                                }`}
                                            >
                                                {job.execution_mode === "cloud"
                                                    ? "Cloud Mode"
                                                    : "Local Mode"}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                                    job.status === "completed"
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : "bg-amber-500/20 text-amber-400"
                                                }`}
                                            >
                                                {job.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar & Details */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                                            <span>
                                                {job.current_step ||
                                                    "Processando via yt-dlp..."}
                                            </span>
                                            <span>
                                                {job.progress_percentage || 25}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{
                                                    width: `${job.progress_percentage || 25}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Additional Stats */}
                                    <div className="flex items-center justify-between text-[10px] text-neutral-400 border-t border-neutral-900 pt-2 font-mono">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Film className="h-3 w-3 text-neutral-500" />
                                                <span>
                                                    {job.processed_videos || 0}{" "}
                                                    / {job.total_videos || 1}{" "}
                                                    vídeos
                                                </span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-neutral-500" />
                                                <span>
                                                    Tempo Restante:{" "}
                                                    {job.estimated_time_remaining ||
                                                        "00:04:30"}
                                                </span>
                                            </span>
                                        </div>
                                        <span>
                                            Custo:{" "}
                                            {job.credit_cost
                                                ? `${job.credit_cost} Cr`
                                                : "Grátis (Local)"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
