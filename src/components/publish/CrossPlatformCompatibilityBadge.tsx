"use client"

import React from "react"
import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    ShieldAlert,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    validateCrossPlatformPublishing,
    type PlatformKey,
    type PostContentType,
    type ExecutionEnvironment,
} from "@/lib/posting/platform-capabilities"

export interface CrossPlatformCompatibilityBadgeProps {
    platforms: string[]
    contentType: PostContentType
    environment: ExecutionEnvironment
    characterCount?: number
    fileSizeBytes?: number
    durationSeconds?: number
}

export function CrossPlatformCompatibilityBadge({
    platforms,
    contentType,
    environment,
    characterCount,
    fileSizeBytes,
    durationSeconds,
}: CrossPlatformCompatibilityBadgeProps) {
    if (platforms.length === 0) {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Nenhuma rede selecionada para publicação cruzada.</span>
            </div>
        )
    }

    const typedPlatforms = platforms.map(p => p.toLowerCase()) as PlatformKey[]
    const validation = validateCrossPlatformPublishing({
        platforms: typedPlatforms,
        contentType,
        environment,
        characterCount,
        fileSizeBytes,
        durationSeconds,
    })

    return (
        <Card className="border border-border/60 bg-card/60 shadow-sm">
            <CardHeader className="pb-3 pt-3">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                    <span className="flex items-center gap-2">
                        {validation.allValid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        Compatibilidade de Formato & Plataformas
                    </span>
                    <Badge
                        variant={
                            environment === "local" ? "outline" : "secondary"
                        }
                        className="text-[10px] uppercase"
                    >
                        Modo {environment}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-3 pt-0">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {typedPlatforms.map(platform => {
                        const res = validation.results[platform]
                        if (!res) return null

                        return (
                            <div
                                key={platform}
                                className={`flex flex-col gap-1 rounded-md border p-2.5 text-xs transition-colors ${
                                    res.isCompatible
                                        ? "border-emerald-500/20 bg-emerald-500/5 text-foreground"
                                        : "border-red-500/30 bg-red-500/5 text-foreground"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold capitalize text-foreground">
                                        {res.displayName}
                                    </span>
                                    {res.isCompatible ? (
                                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                                            <CheckCircle2 className="h-3 w-3" />{" "}
                                            Compatível
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                                            <XCircle className="h-3 w-3" />{" "}
                                            Incompatível
                                        </span>
                                    )}
                                </div>

                                {!res.isCompatible &&
                                    res.reasons.length > 0 && (
                                        <div className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                                            {res.reasons.map((reason, idx) => (
                                                <p
                                                    key={idx}
                                                    className="flex items-start gap-1 text-red-400"
                                                >
                                                    <span className="text-red-500">
                                                        •
                                                    </span>{" "}
                                                    {reason}
                                                </p>
                                            ))}
                                            {res.recommendedAction && (
                                                <p className="flex items-center gap-1 font-medium text-amber-400">
                                                    <ShieldAlert className="h-3 w-3" />{" "}
                                                    {res.recommendedAction}
                                                </p>
                                            )}
                                        </div>
                                    )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
