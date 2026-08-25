"use client"

import { ExecutionModeSwitch } from "@/components/ui/execution-mode-switch"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Search, Upload, Download, Database, Cloud, Laptop } from "lucide-react"

interface DiscoverPlatform {
    username: string
    displayName: string
    profileImageUrl: string | null
    isLive: boolean
}

interface DiscoverUser {
    userId: string
    username: string
    displayName: string
    avatarUrl: string | null
    platforms: Record<string, DiscoverPlatform>
}

const PLATFORM_ICONS: Record<string, { label: string; color: string }> = {
    twitch: { label: "TW", color: "bg-purple-600" },
    kick: { label: "KC", color: "bg-emerald-600" },
    youtube: { label: "YT", color: "bg-red-600" },
    facebook: { label: "FB", color: "bg-blue-600" },
    instagram: { label: "IG", color: "bg-pink-600" },
    tiktok: { label: "TK", color: "bg-neutral-600" },
    linkedin: { label: "LI", color: "bg-blue-800" },
}

export default function DiscoverPage() {
    const t = useTranslations("dashboard.discover")
    const [users, setUsers] = useState<DiscoverUser[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [executionMode, setExecutionMode] = useState<"cloud" | "local">("cloud")
    const [importError, setImportError] = useState<string | null>(null)
    const [importSuccess, setImportSuccess] = useState<string | null>(null)

    // Load initial execution mode preference
    useEffect(() => {
        const stored = localStorage.getItem("discover_execution_mode") || localStorage.getItem("chat_execution_mode")
        if (stored === "local" || stored === "cloud") {
            setExecutionMode(stored)
        }
    }, [])

    const handleModeChange = (mode: "cloud" | "local") => {
        setExecutionMode(mode)
        localStorage.setItem("discover_execution_mode", mode)
    }

    // Fetch or load discover data based on execution mode
    useEffect(() => {
        async function loadDiscoverData() {
            setLoading(true)
            setImportError(null)

            if (executionMode === "local") {
                // Local Mode: Load state saved in localStorage or empty list
                try {
                    const storedLocal = localStorage.getItem("local_discover_users")
                    if (storedLocal) {
                        const parsed = JSON.parse(storedLocal)
                        if (Array.isArray(parsed)) {
                            setUsers(parsed)
                        } else {
                            setUsers([])
                        }
                    } else {
                        setUsers([])
                    }
                } catch {
                    setUsers([])
                } finally {
                    setLoading(false)
                }
                return
            }

            // Cloud Mode: Request from API endpoint
            try {
                const res = await fetch("/api/discover")
                if (res.ok) {
                    const data = await res.json()
                    if (data.success && Array.isArray(data.data)) {
                        setUsers(data.data)
                    }
                }
            } catch {
                // silent
            } finally {
                setLoading(false)
            }
        }

        loadDiscoverData()
    }, [executionMode])

    // Handle Local JSON Import
    const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImportError(null)
        setImportSuccess(null)

        const reader = new FileReader()
        reader.onload = event => {
            try {
                const content = event.target?.result as string
                const parsed = JSON.parse(content)
                const importedUsers = Array.isArray(parsed) ? parsed : parsed.users || []

                if (!Array.isArray(importedUsers)) {
                    throw new Error("Formato JSON inválido. Esperado um array de usuários ou objeto com a propriedade 'users'.")
                }

                setUsers(importedUsers)
                localStorage.setItem("local_discover_users", JSON.stringify(importedUsers))
                setImportSuccess(`${importedUsers.length} canais carregados com sucesso do arquivo JSON local!`)
                setTimeout(() => setImportSuccess(null), 4000)
            } catch (err) {
                setImportError(err instanceof Error ? err.message : "Erro ao importar JSON local")
            }
        }
        reader.readAsText(file)
    }

    // Handle Local JSON Export
    const handleJsonExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users, null, 2))
        const downloadAnchor = document.createElement("a")
        downloadAnchor.setAttribute("href", dataStr)
        downloadAnchor.setAttribute("download", `gabrieltoth-discover-${executionMode}-${Date.now()}.json`)
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
    }

    // Filter users by search query across display names, usernames, and platform names
    const filteredUsers = users.filter(user => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()

        const nameMatch =
            user.displayName.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query)

        const platformMatch = Object.entries(user.platforms).some(
            ([platformKey, pData]) =>
                platformKey.toLowerCase().includes(query) ||
                pData.displayName.toLowerCase().includes(query) ||
                pData.username.toLowerCase().includes(query)
        )

        return nameMatch || platformMatch
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Descobrir Canais ({filteredUsers.length})
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Explore e encontre criadores de conteúdo e transmissões na rede
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <ExecutionModeSwitch
                        mode={executionMode}
                        onChange={handleModeChange}
                    />

                    {executionMode === "local" && (
                        <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white cursor-pointer hover:bg-emerald-700 transition-colors">
                                <Upload className="h-3.5 w-3.5" />
                                <span>Importar JSON</span>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleJsonImport}
                                    className="hidden"
                                />
                            </label>

                            {users.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleJsonExport}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                                    title="Exportar lista de descoberta como arquivo JSON"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Exportar</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar canais por nome, streamer ou plataforma (ex: Twitch, YouTube, Kick)..."
                    className="w-full rounded-lg border border-input bg-card pl-10 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Limpar
                    </button>
                )}
            </div>

            {/* Status Feedback Notices */}
            {importSuccess && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-500 font-medium">
                    {importSuccess}
                </div>
            )}

            {importError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 font-medium">
                    {importError}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
                        <p className="text-muted-foreground">Carregando canais...</p>
                    </div>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                    {executionMode === "local" && users.length === 0 ? (
                        <div className="space-y-3">
                            <Laptop className="h-10 w-10 mx-auto text-emerald-500" />
                            <p className="font-semibold text-foreground">Modo Local Ativo</p>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Nenhum estado local carregado. Suba um arquivo JSON customizado contendo a lista de canais para utilizar o descobrimento local sem consumir créditos da nuvem.
                            </p>
                            <label className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white cursor-pointer hover:bg-emerald-700 transition-colors">
                                <Upload className="h-4 w-4" />
                                <span>Carregar JSON Local</span>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleJsonImport}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            {searchQuery ? `Nenhum canal encontrado para "${searchQuery}".` : "Nenhum canal disponível no momento."}
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredUsers.map(user => {
                        const platformEntries = Object.entries(user.platforms)
                        return (
                            <a
                                key={user.userId}
                                href={`/${typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "pt-BR"}/streamer/${user.username}`}
                                className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors block shadow-sm"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground overflow-hidden">
                                        {user.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt={user.displayName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            user.displayName.slice(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-foreground truncate">
                                            {user.displayName}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            @{user.username}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
                                    {platformEntries.map(([platformKey, pData]) => {
                                        const iconMeta = PLATFORM_ICONS[platformKey] || {
                                            label: platformKey.slice(0, 2).toUpperCase(),
                                            color: "bg-neutral-600",
                                        }
                                        return (
                                            <span
                                                key={platformKey}
                                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-white ${iconMeta.color}`}
                                            >
                                                {iconMeta.label}
                                                {pData.isLive && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                )}
                                            </span>
                                        )
                                    })}
                                </div>
                            </a>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
