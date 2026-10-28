/**
 * ChatModerationPanel Component
 * UI controls for Chat Moderation, Auto-Bot responses & Filters
 */

"use client"

import { ModerationRule } from "@/lib/chat/moderation"
import { BotCommand } from "@/lib/chat/bot-responder"
import { useTranslations } from "next-intl"
import { useState } from "react"

interface ChatModerationPanelProps {
    initialRules?: ModerationRule[]
    initialCommands?: BotCommand[]
}

export function ChatModerationPanel({
    initialRules = [],
    initialCommands = [],
}: ChatModerationPanelProps) {
    const t = useTranslations("dashboard.live")
    const [rules, setRules] = useState<ModerationRule[]>(initialRules)
    const [commands, setCommands] = useState<BotCommand[]>(initialCommands)

    const [newPattern, setNewPattern] = useState("")
    const [newTrigger, setNewTrigger] = useState("")
    const [newResponse, setNewResponse] = useState("")

    const handleAddRule = () => {
        if (!newPattern.trim()) return
        const rule: ModerationRule = {
            id: Date.now().toString(),
            pattern: newPattern.trim(),
            type: "keyword",
            action: "block",
        }
        setRules([...rules, rule])
        setNewPattern("")
    }

    const handleAddCommand = () => {
        if (!newTrigger.trim() || !newResponse.trim()) return
        const cmd: BotCommand = {
            trigger: newTrigger.trim(),
            response: newResponse.trim(),
            enabled: true,
        }
        setCommands([...commands, cmd])
        setNewTrigger("")
        setNewResponse("")
    }

    return (
        <div className="rounded-xl border border-neutral-800 bg-background p-4 backdrop-blur-sm space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-2">
                    {t("moderationRules")}
                </h3>
                <div className="mt-3 flex gap-2">
                    <input
                        type="text"
                        placeholder={t("addBlockedKeyword")}
                        value={newPattern}
                        onChange={e => setNewPattern(e.target.value)}
                        className="flex-1 rounded-lg border border-neutral-700 bg-card px-3 py-1.5 text-xs text-neutral-100 focus:outline-none"
                    />
                    <button
                        onClick={handleAddRule}
                        className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                    >
                        {t("addRule")}
                    </button>
                </div>
                <ul className="mt-3 space-y-1">
                    {rules.map(rule => (
                        <li
                            key={rule.id}
                            className="flex items-center justify-between rounded-lg bg-card px-3 py-1.5 text-xs text-neutral-300"
                        >
                            <span>
                                {t("keywordLabel")}{" "}
                                <strong>{rule.pattern}</strong> ({rule.action})
                            </span>
                            <button
                                onClick={() =>
                                    setRules(
                                        rules.filter(r => r.id !== rule.id)
                                    )
                                }
                                className="text-neutral-500 hover:text-red-400"
                            >
                                {t("remove")}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-2">
                    {t("botCommands")}
                </h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                        type="text"
                        placeholder={t("triggerPlaceholder")}
                        value={newTrigger}
                        onChange={e => setNewTrigger(e.target.value)}
                        className="rounded-lg border border-neutral-700 bg-card px-3 py-1.5 text-xs text-neutral-100 focus:outline-none"
                    />
                    <input
                        type="text"
                        placeholder={t("botResponsePlaceholder")}
                        value={newResponse}
                        onChange={e => setNewResponse(e.target.value)}
                        className="rounded-lg border border-neutral-700 bg-card px-3 py-1.5 text-xs text-neutral-100 focus:outline-none"
                    />
                </div>
                <button
                    onClick={handleAddCommand}
                    className="mt-2 rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                >
                    {t("addBotCommand")}
                </button>
                <ul className="mt-3 space-y-1">
                    {commands.map((cmd, idx) => (
                        <li
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-card px-3 py-1.5 text-xs text-neutral-300"
                        >
                            <span>
                                <strong>{cmd.trigger}</strong> &rarr;{" "}
                                {cmd.response}
                            </span>
                            <button
                                onClick={() =>
                                    setCommands(
                                        commands.filter((_, i) => i !== idx)
                                    )
                                }
                                className="text-neutral-500 hover:text-red-400"
                            >
                                {t("remove")}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
