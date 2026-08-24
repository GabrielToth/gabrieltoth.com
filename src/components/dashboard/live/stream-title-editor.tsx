/**
 * StreamTitleEditor Component
 * Allows editing stream title and game for connected platforms with category autocomplete dropdown
 */

"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface StreamTitleEditorProps {
    platform: string
    currentTitle: string
    currentGame: string
    onUpdate: () => void
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
}: StreamTitleEditorProps) {
    const [title, setTitle] = useState(currentTitle || "")
    const [game, setGame] = useState(currentGame || "")
    const [selectedGameId, setSelectedGameId] = useState<string>("")
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{
        type: "success" | "error"
        text: string
    } | null>(null)

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
        setSaving(true)
        setMessage(null)

        try {
            const response = await fetch("/api/live/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform,
                    title: title.trim(),
                    game_id: selectedGameId || game,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setMessage({ type: "success", text: "Stream updated!" })
                onUpdate()
            } else {
                setMessage({
                    type: "error",
                    text: data.error || "Failed to update",
                })
            }
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof Error ? err.message : "Unknown error",
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
                    Stream Title
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={140}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring dark:border-border dark:bg-card dark:text-foreground"
                    placeholder="Enter stream title..."
                />
            </div>

            <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">
                    Game / Category
                </label>
                <input
                    type="text"
                    value={game}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={e => {
                        setGame(e.target.value)
                        setSelectedGameId("")
                        setIsDropdownOpen(true)
                    }}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring dark:border-border dark:bg-card dark:text-foreground"
                    placeholder="Search game or category for connected platforms..."
                />

                {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-md border border-border bg-card shadow-lg text-xs">
                        {connectedPlatforms.length > 0 && (
                            <div className="border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground font-mono">
                                Connected platforms:{" "}
                                {connectedPlatforms.join(", ")}
                            </div>
                        )}

                        {loadingCategories ? (
                            <div className="p-3 text-center text-muted-foreground">
                                Searching categories...
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="p-3 text-center text-muted-foreground">
                                No categories found
                            </div>
                        ) : (
                            categories.map(cat => (
                                <button
                                    key={`${cat.platform}-${cat.id}`}
                                    type="button"
                                    onClick={() => handleSelectCategory(cat)}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent focus:bg-accent transition-colors border-b border-border/20 last:border-0"
                                >
                                    <div className="flex items-center space-x-2 min-w-0">
                                        {cat.boxArtUrl ? (
                                            <img
                                                src={cat.boxArtUrl}
                                                alt={cat.name}
                                                className="h-7 w-5 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="h-7 w-5 rounded bg-muted flex items-center justify-center text-[9px] font-mono">
                                                🎮
                                            </div>
                                        )}
                                        <span className="truncate font-medium text-foreground">
                                            {cat.name}
                                        </span>
                                    </div>
                                    <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase font-bold bg-primary/10 text-primary">
                                        {cat.platform}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
                {saving ? "Saving..." : "Update Stream"}
            </button>

            {message && (
                <div
                    className={`rounded-md p-3 text-sm ${
                        message.type === "success"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                    }`}
                >
                    {message.text}
                </div>
            )}
        </div>
    )
}
