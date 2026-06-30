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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useLocalEnvs } from "@/lib/local-envs"
import {
    KNOWN_SERVICES,
    MODE_DESCRIPTIONS,
    MODE_LABELS,
} from "@/lib/local-envs"
import type { EnvMode, ServiceDefinition } from "@/lib/local-envs"
import { cn } from "@/lib/utils"
import {
    Eye,
    EyeOff,
    Globe,
    Mail,
    MessageCircle,
    Music,
    Sparkles,
    Trash2,
} from "lucide-react"
import React, { useState } from "react"
import { FaFacebook, FaLinkedin, FaTwitter } from "react-icons/fa"

const SERVICE_ICONS: Record<string, React.ReactNode> = {
    google: <Globe className="h-5 w-5" />,
    meta: <FaFacebook className="h-5 w-5" />,
    tiktok: <Music className="h-5 w-5" />,
    twitter: <FaTwitter className="h-5 w-5" />,
    linkedin: <FaLinkedin className="h-5 w-5" />,
    openai: <Sparkles className="h-5 w-5" />,
    resend: <Mail className="h-5 w-5" />,
    discord: <MessageCircle className="h-5 w-5" />,
}

function EnvVarInput({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    def: { key, label, secret },
    value,
    onChange,
    onRemove,
}: {
    def: ServiceDefinition["envVars"][number]
    value: string
    onChange: (value: string) => void
    onRemove: () => void
}) {
    const [show, setShow] = useState(false)

    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                {secret ? (
                    <div className="relative">
                        <Input
                            type={show ? "text" : "password"}
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            placeholder={label}
                            className="pr-10 font-mono text-xs"
                        />
                        <button
                            type="button"
                            onClick={() => setShow(!show)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {show ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                ) : (
                    <Input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={label}
                        className="font-mono text-xs"
                    />
                )}
            </div>
            {value && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title={`Remove ${label}`}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

export function LocalEnvSection() {
    const { definedServices, setMode, setEnv, removeEnv, clearAll } =
        useLocalEnvs()
    const [expanded, setExpanded] = useState<string | null>(null)

    const hasAnyLocal =
        definedServices.some(s => s.mode !== "cloud_only") ||
        definedServices.some(s => s.envs.length > 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    APIs Locais
                </CardTitle>
                <CardDescription>
                    Adicione suas próprias chaves de API para usar localmente no
                    navegador. Nenhuma dessas informações é enviada para nossos
                    servidores. Escolha o modo de fallback para cada serviço.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {KNOWN_SERVICES.map(serviceDef => {
                    const stored = definedServices.find(
                        s => s.serviceId === serviceDef.id
                    )
                    const currentMode = stored?.mode ?? "cloud_only"
                    const currentEnvs = stored?.envs ?? []
                    const isExpanded = expanded === serviceDef.id

                    return (
                        <div
                            key={serviceDef.id}
                            className="rounded-lg border p-4 space-y-3"
                        >
                            {/* Service header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-muted-foreground">
                                        {SERVICE_ICONS[serviceDef.id] ??
                                            SERVICE_ICONS.google}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">
                                            {serviceDef.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {MODE_LABELS[currentMode]}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={currentMode}
                                        onValueChange={v =>
                                            setMode(serviceDef.id, v as EnvMode)
                                        }
                                    >
                                        <SelectTrigger className="w-44">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(
                                                Object.entries(MODE_LABELS) as [
                                                    EnvMode,
                                                    string,
                                                ][]
                                            ).map(([mode, label]) => (
                                                <SelectItem
                                                    key={mode}
                                                    value={mode}
                                                >
                                                    <div className="flex flex-col">
                                                        <span>{label}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {
                                                                MODE_DESCRIPTIONS[
                                                                    mode
                                                                ]
                                                            }
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {currentMode !== "cloud_only" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpanded(
                                                    isExpanded
                                                        ? null
                                                        : serviceDef.id
                                                )
                                            }
                                            className="text-xs text-muted-foreground hover:text-foreground underline"
                                        >
                                            {isExpanded
                                                ? "Recolher"
                                                : `${currentEnvs.length} variável(is)`}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Mode description */}
                            <p
                                className={cn(
                                    "text-xs",
                                    currentMode === "local_only" &&
                                        "text-amber-600",
                                    currentMode === "local_preferred" &&
                                        "text-blue-600",
                                    currentMode === "cloud_preferred" &&
                                        "text-green-600",
                                    currentMode === "cloud_only" &&
                                        "text-muted-foreground"
                                )}
                            >
                                {MODE_DESCRIPTIONS[currentMode]}
                            </p>

                            {/* Env vars form */}
                            {isExpanded && (
                                <div className="space-y-2 pt-2 border-t">
                                    {serviceDef.envVars.map(envDef => {
                                        const existing = currentEnvs.find(
                                            e => e.key === envDef.key
                                        )
                                        return (
                                            <EnvVarInput
                                                key={envDef.key}
                                                def={envDef}
                                                value={existing?.value ?? ""}
                                                onChange={val => {
                                                    if (val) {
                                                        setEnv(
                                                            serviceDef.id,
                                                            envDef.key,
                                                            val,
                                                            envDef.label
                                                        )
                                                    } else {
                                                        removeEnv(
                                                            serviceDef.id,
                                                            envDef.key
                                                        )
                                                    }
                                                }}
                                                onRemove={() =>
                                                    removeEnv(
                                                        serviceDef.id,
                                                        envDef.key
                                                    )
                                                }
                                            />
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}

                {hasAnyLocal && (
                    <div className="flex justify-end pt-2 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={clearAll}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Limpar todas as chaves locais
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
