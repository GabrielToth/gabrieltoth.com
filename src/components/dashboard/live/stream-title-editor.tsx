/**
 * StreamTitleEditor Component
 * Allows editing stream title and game for connected platforms
 */

"use client"

import { useState } from "react"

interface StreamTitleEditorProps {
    platform: string
    currentTitle: string
    currentGame: string
    onUpdate: () => void
}

export function StreamTitleEditor({
    platform,
    currentTitle,
    currentGame,
    onUpdate,
}: StreamTitleEditorProps) {
    const [title, setTitle] = useState(currentTitle || "")
    const [game, setGame] = useState(currentGame || "")
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{
        type: "success" | "error"
        text: string
    } | null>(null)

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
                    game_id: game,
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

            <div>
                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-1">
                    Game / Category
                </label>
                <input
                    type="text"
                    value={game}
                    onChange={e => setGame(e.target.value)}
                    className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring dark:border-border dark:bg-card dark:text-foreground"
                    placeholder="Enter game or category..."
                />
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
                {saving ? "Saving..." : "Update Stream"}
            </button>

            {message && (
                <p
                    className={`text-sm ${
                        message.type === "success"
                            ? "text-green-600"
                            : "text-red-600"
                    }`}
                >
                    {message.text}
                </p>
            )}
        </div>
    )
}
