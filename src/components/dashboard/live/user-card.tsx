"use client"

import { useCallback } from "react"

interface UserCardProps {
    username: string
    displayName: string
    platform: string
    userId: string
    platformBadge: { label: string; bgClass: string }
    isBroadcaster?: boolean
    isModerator?: boolean
    isSubscriber?: boolean
    isVip?: boolean
    onClose: () => void
    onModerate: (action: string, duration?: number) => void
}

const TIMEOUT_OPTIONS = [
    { label: "10s", duration: 10 },
    { label: "10min", duration: 600 },
    { label: "1h", duration: 3600 },
    { label: "1d", duration: 86400 },
    { label: "1w", duration: 604800 },
]

const ROLE_COLORS: Record<string, string> = {
    broadcaster: "text-purple-400",
    moderator: "text-emerald-400",
    subscriber: "text-blue-400",
    vip: "text-yellow-400",
}

export function UserCard({
    username,
    displayName,
    platform: _platform,
    platformBadge,
    isBroadcaster,
    isModerator,
    isSubscriber,
    isVip,
    onClose,
    onModerate,
}: UserCardProps) {
    const handleTimeout = useCallback(
        (duration: number) => {
            onModerate("timeout", duration)
        },
        [onModerate]
    )

    return (
        <div className="rounded-xl border border-neutral-700 bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[10px] px-2 py-1 rounded font-bold uppercase text-white ${platformBadge.bgClass}`}
                    >
                        {platformBadge.label}
                    </span>
                    <div>
                        <p className="text-sm font-bold text-neutral-100">
                            {displayName}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                            @{username}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-neutral-500 hover:text-neutral-300 text-lg leading-none"
                >
                    &times;
                </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
                {isBroadcaster && (
                    <span
                        className={`text-[10px] font-semibold ${ROLE_COLORS.broadcaster}`}
                    >
                        Broadcaster
                    </span>
                )}
                {isModerator && (
                    <span
                        className={`text-[10px] font-semibold ${ROLE_COLORS.moderator}`}
                    >
                        Mod
                    </span>
                )}
                {isSubscriber && (
                    <span
                        className={`text-[10px] font-semibold ${ROLE_COLORS.subscriber}`}
                    >
                        Sub
                    </span>
                )}
                {isVip && (
                    <span
                        className={`text-[10px] font-semibold ${ROLE_COLORS.vip}`}
                    >
                        VIP
                    </span>
                )}
            </div>

            <div className="space-y-1.5">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                    Timeout
                </p>
                <div className="flex flex-wrap gap-1">
                    {TIMEOUT_OPTIONS.map(opt => (
                        <button
                            key={opt.duration}
                            onClick={() => handleTimeout(opt.duration)}
                            className="rounded-md bg-card px-2.5 py-1.5 text-[11px] font-medium text-neutral-200 hover:bg-orange-600/30 hover:text-orange-300 transition-colors"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 mt-3">
                <button
                    onClick={() => onModerate("ban")}
                    className="flex-1 rounded-md bg-red-600/20 px-3 py-2 text-[11px] font-semibold text-red-400 hover:bg-red-600/40 transition-colors"
                >
                    Ban
                </button>
                <button
                    onClick={() => onModerate("unban")}
                    className="flex-1 rounded-md bg-emerald-600/20 px-3 py-2 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-600/40 transition-colors"
                >
                    Unban
                </button>
            </div>
        </div>
    )
}
