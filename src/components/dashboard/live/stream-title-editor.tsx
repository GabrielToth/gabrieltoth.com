/**
 * StreamTitleEditor Component
 * Allows editing stream title and game for connected platforms with category autocomplete dropdown
 * Features instant optimistic UI feedback with loading spinner indicator during backend sync
 */

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"

interface StreamTitleEditorProps {
    platform: string
    currentTitle: string
    currentGame: string
    onUpdate: () => void
    onUpdateOptimistic?: (platform: string, title: string, game: string) => void
    executionMode?: "cloud" | "local"
}

interface CategoryOption {
    id: string
    name: string
    platform: string
    boxArtUrl?: string
}

export function StreamTitleEditor({
    platform,
    currentTitle,
    currentGame,
    onUpdate,
    onUpdateOptimistic,
    executionMode = "cloud",
}: StreamTitleEditorProps) {
    const [title, setTitle] = useState(currentTitle || "")
    const [game, setGame] = useState(currentGame || "")
    const [selectedGameId, setSelectedGameId] = useState<string>("")
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{
        type: "success" | "error"
        text: string
    } | null>(null)

    // Sync input states when current props change from external updates
    useEffect(() => {
        setTitle(currentTitle || "")
    }, [currentTitle])

    useEffect(() => {
        setGame(currentGame || "")
    }, [currentGame])

    // Category Autocomplete State
    const [categories, setCategories] = useState<CategoryOption[]>([])
    const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [loadingCategories, setLoadingCategories] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchCategories = useCallback(
        async (query: string) => {
            setLoadingCategories(true)
            try {
                const res = await fetch(
                    `/api/live/categories?query=${encodeURIComponent(query)}&platform=${platform}`
                )
                if (!res.ok) return
                const data = await res.json()
                if (data.success) {
                    setCategories(data.categories || [])
                    setConnectedPlatforms(data.connectedPlatforms || [platform])
                }
            } catch {
                // Silently handle autocomplete network errors
            } finally {
                setLoadingCategories(false)
            }
        },
        [platform]
    )

    useEffect(() => {
        if (isDropdownOpen) {
            fetchCategories(game)
        }
    }, [game, isDropdownOpen, fetchCategories])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () =>
            document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelectCategory = (cat: CategoryOption) => {
        setGame(cat.name)
        setSelectedGameId(cat.id)
        setIsDropdownOpen(false)
    }

    const handleSave = async () => {
        const trimmedTitle = title.trim()
        const trimmedGame = game.trim()
        if (!trimmedTitle) return

        setSaving(true)
        setMessage(null)

        // 1. Instant Optimistic UI Update (Immediate response for user)
        if (onUpdateOptimistic) {
            onUpdateOptimistic(platform, trimmedTitle, trimmedGame)
        }

        try {
            // Check if user has local credentials configured in local mode
            const isLocalMode = executionMode === "local"
            let endpointUrl = "/api/live/update"
            const requestHeaders: Record<string, string> = {
                "Content-Type": "application/json",
            }
            const requestBody: Record<string, unknown> = {
                platform,
                title: trimmedTitle,
                game_id: selectedGameId || trimmedGame,
            }

            if (isLocalMode && typeof window !== "undefined") {
                const localCreds = localStorage.getItem(`${platform}_dev_config`)
                if (localCreds) {
                    try {
                        requestBody.localConfig = JSON.parse(localCreds)
                    } catch {
                        // ignore parse err
                    }
                }
            }

            const response = await fetch(endpointUrl, {
                method: "POST",
                headers: requestHeaders,
                body: JSON.stringify(requestBody),
            })

            const data = await response.json()

            if (data.success) {
                setMessage({
                    type: "success",
                    text: data.message || "Stream updated!",
                })
                onUpdate()
            } else {
                setMessage({
                    type: "error",
                    text: data.error || "Falha ao atualizar dados da live",
                })
            }
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Erro desconhecido",
            })
        } finally {
            setSaving(false)
            setTimeout(() => setMessage(null), 3000)
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">
                    Título da Live ({platform.toUpperCase()})
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={140}
                    disabled={saving}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring dark:border-border dark:bg-card dark:text-foreground disabled:opacity-60"
                    placeholder="Enter stream title..."
                />
            </div>

            <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">
                    Jogo / Categoria
                </label>
                <input
                    type="text"
                    value={game}
                    disabled={saving}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={e => {
                        setGame(e.target.value)
                        setSelectedGameId("")
                        setIsDropdownOpen(true)
                    }}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring dark:border-border dark:bg-card dark:text-foreground disabled:opacity-60"
                    placeholder="Search game or category for connected platforms..."
                />

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-white p-1 shadow-lg dark:border-border dark:bg-card">
                        {loadingCategories ? (
                            <div className="flex items-center justify-center p-3 text-xs text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                                Buscando categorias ({platform})...
                            </div>
                        ) : categories.length > 0 ? (
                            categories.map(cat => (
                                <button
                                    key={`${cat.platform}-${cat.id}`}
                                    type="button"
                                    onClick={() => handleSelectCategory(cat)}
                                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-muted dark:hover:bg-accent"
                                >
                                    {cat.boxArtUrl && (
                                        <img
                                            src={cat.boxArtUrl}
                                            alt={cat.name}
                                            className="h-8 w-6 rounded object-cover"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">
                                            {cat.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {cat.platform}
                                        </p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-center text-xs text-muted-foreground">
                                Nenhuma categoria encontrada.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action button with inline status & loading spinner */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                    {saving && (
                        <div className="flex items-center text-xs text-blue-500 font-medium animate-pulse">
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-blue-500" />
                            <span>Sincronizando com a plataforma...</span>
                        </div>
                    )}

                    {message && (
                        <div
                            className={`flex items-center text-xs font-medium ${
                                message.type === "success"
                                    ? "text-emerald-700"
                                    : "text-red-500"
                            }`}
                        >
                            {message.type === "success" ? (
                                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            ) : (
                                <AlertCircle className="mr-1.5 h-4 w-4" />
                            )}
                            <span className={message.type === "success" ? "text-emerald-700" : undefined}>{message.text}</span>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-all min-w-[140px]"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Update Stream"
                    )}
                </button>
            </div>
        </div>
    )
}
