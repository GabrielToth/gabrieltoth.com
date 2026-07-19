/**
 * StreamStatusCard Component
 * Displays live stream status for a single platform
 */

"use client"

interface StreamStatusCardProps {
    platform: string
    username: string
    displayName: string
    isLive: boolean
    viewerCount: number
    title: string
    gameName: string
    startedAt: string | null
}

export function StreamStatusCard({
    platform,
    displayName,
    isLive,
    viewerCount,
    title,
    gameName,
    startedAt,
}: StreamStatusCardProps) {
    const getUptime = (): string => {
        if (!startedAt) return "—"
        const start = new Date(startedAt).getTime()
        const now = Date.now()
        const diff = now - start
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        return `${hours}h ${minutes}m`
    }

    const getPlatformColor = (): string => {
        return platform === "twitch" ? "#9146FF" : "#53FC18"
    }

    return (
        <div
            className="rounded-lg border p-4 transition-shadow hover:shadow-md"
            style={{
                borderColor: isLive ? getPlatformColor() : "rgb(229, 231, 235)",
                borderLeftWidth: "4px",
                borderLeftColor: isLive ? getPlatformColor() : undefined,
            }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: getPlatformColor() }}
                    >
                        {platform === "twitch" ? "T" : "K"}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground dark:text-foreground">
                            {displayName}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                            {platform}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isLive && (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-2xl font-bold text-foreground dark:text-foreground">
                        {isLive ? viewerCount.toLocaleString() : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Viewers</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-foreground dark:text-foreground">
                        {isLive ? getUptime() : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-foreground dark:text-foreground">
                        {gameName || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Game</p>
                </div>
            </div>

            {title && (
                <p className="mt-3 truncate text-sm text-muted-foreground dark:text-muted-foreground">
                    {title}
                </p>
            )}
        </div>
    )
}
