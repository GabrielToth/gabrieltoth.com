"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    deleteLocalProject,
    getLocalChannels,
    getLocalProjects,
    removeLocalChannelBinding,
    saveLocalChannelBinding,
    saveLocalProject,
} from "@/lib/local-projects"
import type {
    LocalChannelProjectBinding,
    LocalProject,
    PlatformType,
} from "@/lib/local-projects"
import {
    CheckCircle2,
    Layers,
    Plus,
    RefreshCw,
    ShieldCheck,
    Trash2,
    Tv,
} from "lucide-react"
import React, { useEffect, useState } from "react"

const PLATFORMS: { id: PlatformType; name: string }[] = [
    { id: "youtube", name: "YouTube" },
    { id: "meta", name: "Meta (Facebook / Instagram)" },
    { id: "twitch", name: "Twitch" },
    { id: "kick", name: "Kick" },
    { id: "tiktok", name: "TikTok" },
    { id: "twitter", name: "Twitter / X" },
    { id: "linkedin", name: "LinkedIn" },
]

export function LocalProjectsSection() {
    const [projects, setProjects] = useState<LocalProject[]>([])
    const [channels, setChannels] = useState<LocalChannelProjectBinding[]>([])
    const [projectModalOpen, setProjectModalOpen] = useState(false)
    const [channelModalOpen, setChannelModalOpen] = useState(false)

    // Form states for new project
    const [projName, setProjName] = useState("")
    const [projPlatform, setProjPlatform] = useState<PlatformType>("youtube")
    const [projClientId, setProjClientId] = useState("")
    const [projClientSecret, setProjClientSecret] = useState("")
    const [projApiKey, setProjApiKey] = useState("")
    const [dailyQuotaLimit, setDailyQuotaLimit] = useState("10000")

    // Form states for channel binding
    const [chanId, setChanId] = useState("")
    const [chanName, setChanName] = useState("")
    const [chanPlatform, setChanPlatform] = useState<PlatformType>("youtube")
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
    const [chanAccessToken, setChanAccessToken] = useState("")

    const reloadData = () => {
        setProjects(getLocalProjects())
        setChannels(getLocalChannels())
    }

    useEffect(() => {
        reloadData()
    }, [])

    const handleSaveProject = () => {
        if (!projName.trim()) return

        const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        const maxLimit = parseInt(dailyQuotaLimit, 10) || 10000

        saveLocalProject({
            id,
            name: projName.trim(),
            platform: projPlatform,
            clientId: projClientId.trim() || undefined,
            clientSecret: projClientSecret.trim() || undefined,
            apiKey: projApiKey.trim() || undefined,
            quotas: {
                daily_units: {
                    maxLimit,
                    periodMs: 24 * 60 * 60 * 1000,
                    resetTime: Date.now() + 24 * 60 * 60 * 1000,
                    currentUsage: 0,
                },
            },
        })

        setProjName("")
        setProjClientId("")
        setProjClientSecret("")
        setProjApiKey("")
        setProjectModalOpen(false)
        reloadData()
    }

    const handleSaveChannel = () => {
        if (!chanId.trim() || !chanName.trim()) return

        const auths = selectedProjectIds.map(pId => ({
            projectId: pId,
            accessToken: chanAccessToken.trim() || undefined,
        }))

        saveLocalChannelBinding({
            channelId: chanId.trim(),
            channelName: chanName.trim(),
            platform: chanPlatform,
            projectIds: selectedProjectIds,
            auths,
        })

        setChanId("")
        setChanName("")
        setChanAccessToken("")
        setSelectedProjectIds([])
        setChannelModalOpen(false)
        reloadData()
    }

    const toggleProjectForChannel = (pId: string) => {
        setSelectedProjectIds(prev =>
            prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
        )
    }

    return (
        <Card className="border-border">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                            <Layers className="h-5 w-5 text-emerald-500" />
                            Projetos & Quotas Locais (N:N Multi-Projeto)
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Distribua dezenas ou centenas de canais entre
                            múltiplos projetos e quotas com rotação automática.
                            Zero chaves enviadas ao servidor. Zero consumo de
                            créditos.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProjectModalOpen(true)}
                            className="flex items-center gap-1.5"
                        >
                            <Plus className="h-4 w-4" /> Novo Projeto
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                                setSelectedProjectIds([])
                                setChannelModalOpen(true)
                            }}
                            className="flex items-center gap-1.5"
                        >
                            <Tv className="h-4 w-4" /> Vincular Canal Local
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Projects List */}
                <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Projetos / Chaves Locais Cadastradas ({projects.length})
                    </h3>
                    {projects.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                            Nenhum projeto local cadastrado ainda. Adicione um
                            ou mais projetos do Google Console, Meta ou Twitch
                            para balancear as cotas.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map(p => {
                                const daily = p.quotas.daily_units
                                const percent = Math.min(
                                    100,
                                    Math.round(
                                        (daily.currentUsage / daily.maxLimit) *
                                            100
                                    )
                                )
                                return (
                                    <div
                                        key={p.id}
                                        className="rounded-lg border border-border bg-card p-4 space-y-3 relative"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-foreground text-sm">
                                                    {p.name}
                                                </h4>
                                                <span className="text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                    {p.platform}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    deleteLocalProject(p.id)
                                                    reloadData()
                                                }}
                                                className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Quota bar */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Cota Diária:</span>
                                                <span>
                                                    {daily.currentUsage} /{" "}
                                                    {daily.maxLimit} pts (
                                                    {percent}%)
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${
                                                        percent > 85
                                                            ? "bg-red-500"
                                                            : percent > 60
                                                              ? "bg-amber-500"
                                                              : "bg-emerald-500"
                                                    }`}
                                                    style={{
                                                        width: `${percent}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                                            <span className="flex items-center gap-1">
                                                <span
                                                    className={`h-2 w-2 rounded-full ${
                                                        p.status === "active"
                                                            ? "bg-emerald-500"
                                                            : p.status ===
                                                                "rate_limited"
                                                              ? "bg-amber-500 animate-pulse"
                                                              : "bg-red-500"
                                                    }`}
                                                />
                                                {p.status.toUpperCase()}
                                            </span>
                                            {p.apiKey && (
                                                <span className="font-mono text-[10px]">
                                                    API Key ativa
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Channels N:N Bindings */}
                <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <Tv className="h-4 w-4 text-primary" />
                        Canais Locais Vinculados ({channels.length})
                    </h3>
                    {channels.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                            Nenhum canal associado a projetos locais no momento.
                        </div>
                    ) : (
                        <div className="divide-y divide-border border rounded-lg overflow-hidden">
                            {channels.map(c => (
                                <div
                                    key={`${c.platform}-${c.channelId}`}
                                    className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-foreground">
                                                {c.channelName}
                                            </span>
                                            <span className="text-[10px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                {c.platform}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                            ID: {c.channelId}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                            <span className="text-xs text-muted-foreground font-medium">
                                                Projetos Atribuídos:
                                            </span>
                                            {c.projectIds.length === 0 ? (
                                                <span className="text-xs text-amber-500">
                                                    Nenhum (usando pool global
                                                    da plataforma)
                                                </span>
                                            ) : (
                                                c.projectIds.map(pId => {
                                                    const p = projects.find(
                                                        proj => proj.id === pId
                                                    )
                                                    return (
                                                        <span
                                                            key={pId}
                                                            className="text-xs rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 flex items-center gap-1"
                                                        >
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            {p ? p.name : pId}
                                                        </span>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            removeLocalChannelBinding(
                                                c.channelId,
                                                c.platform
                                            )
                                            reloadData()
                                        }}
                                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Modal: New Local Project */}
            <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Adicionar Projeto / Chave Local
                        </DialogTitle>
                        <DialogDescription>
                            Adicione as credenciais do seu próprio projeto para
                            operar em modo local.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Nome do Projeto
                            </label>
                            <Input
                                placeholder="ex: Google Console - Live Pool 01"
                                value={projName}
                                onChange={e => setProjName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Plataforma
                            </label>
                            <Select
                                value={projPlatform}
                                onValueChange={(val: PlatformType) =>
                                    setProjPlatform(val)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PLATFORMS.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Client ID / App ID (Opcional)
                            </label>
                            <Input
                                placeholder="client-id..."
                                value={projClientId}
                                onChange={e => setProjClientId(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Client Secret / App Secret (Opcional)
                            </label>
                            <Input
                                type="password"
                                placeholder="client-secret..."
                                value={projClientSecret}
                                onChange={e =>
                                    setProjClientSecret(e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                API Key Direta (Para monitoramento de live sem
                                OAuth)
                            </label>
                            <Input
                                placeholder="AIzaSy..."
                                value={projApiKey}
                                onChange={e => setProjApiKey(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Limite de Cota Diária (Unidades)
                            </label>
                            <Input
                                type="number"
                                placeholder="10000"
                                value={dailyQuotaLimit}
                                onChange={e =>
                                    setDailyQuotaLimit(e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setProjectModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveProject}
                            disabled={!projName.trim()}
                        >
                            Salvar Projeto Local
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Bind Channel N:N */}
            <Dialog open={channelModalOpen} onOpenChange={setChannelModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Vincular Canal a Projetos Locais (N:N)
                        </DialogTitle>
                        <DialogDescription>
                            Atribua um canal a um ou mais projetos locais para
                            balanceamento e fallback de cotas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium">
                                    ID do Canal
                                </label>
                                <Input
                                    placeholder="ex: UCxxxx / @canal"
                                    value={chanId}
                                    onChange={e => setChanId(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium">
                                    Nome do Canal
                                </label>
                                <Input
                                    placeholder="ex: Meu Canal Live 01"
                                    value={chanName}
                                    onChange={e => setChanName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Plataforma
                            </label>
                            <Select
                                value={chanPlatform}
                                onValueChange={(val: PlatformType) => {
                                    setChanPlatform(val)
                                    setSelectedProjectIds([])
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PLATFORMS.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Selecionar Projetos para Balanceamento /
                                Fallback:
                            </label>
                            <div className="max-h-36 overflow-y-auto border rounded-md p-2 space-y-1.5">
                                {projects
                                    .filter(p => p.platform === chanPlatform)
                                    .map(p => {
                                        const isSelected =
                                            selectedProjectIds.includes(p.id)
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() =>
                                                    toggleProjectForChannel(
                                                        p.id
                                                    )
                                                }
                                                className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs transition-colors ${
                                                    isSelected
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/30"
                                                        : "hover:bg-muted"
                                                }`}
                                            >
                                                <span>{p.name}</span>
                                                <span>
                                                    {isSelected
                                                        ? "Selecionado"
                                                        : "Clique p/ Adicionar"}
                                                </span>
                                            </div>
                                        )
                                    })}
                                {projects.filter(
                                    p => p.platform === chanPlatform
                                ).length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                        Nenhum projeto cadastrado para{" "}
                                        {chanPlatform}.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">
                                Access Token Local do Canal (Opcional, salvo
                                apenas no navegador)
                            </label>
                            <Input
                                type="password"
                                placeholder="ya29... ou token de acesso"
                                value={chanAccessToken}
                                onChange={e =>
                                    setChanAccessToken(e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setChannelModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveChannel}
                            disabled={!chanId.trim() || !chanName.trim()}
                        >
                            Salvar Vínculo Local
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
