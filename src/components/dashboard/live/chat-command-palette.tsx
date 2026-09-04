/**
 * ChatCommandPalette Component
 * Slash command autocomplete dropdown for chat input
 */

"use client"

export interface CommandItem {
    name: string
    description: string
    usage: string
}

interface ChatCommandPaletteProps {
    commands: CommandItem[]
    selectedIndex: number
    onSelect: (cmd: CommandItem) => void
}

export function ChatCommandPalette({
    commands,
    selectedIndex,
    onSelect,
}: ChatCommandPaletteProps) {
    if (commands.length === 0) return null

    return (
        <div className="absolute bottom-full mb-1 left-0 right-0 max-h-48 overflow-y-auto rounded-lg border border-neutral-700 bg-background p-1 shadow-lg z-20 text-xs">
            {commands.map((cmd, index) => (
                <button
                    key={cmd.name}
                    onClick={() => onSelect(cmd)}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${
                        index === selectedIndex
                            ? "bg-card text-white font-medium"
                            : "text-neutral-300 hover:bg-card"
                    }`}
                >
                    <span className="font-mono text-emerald-400 font-bold">
                        {cmd.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                        {cmd.description}
                    </span>
                </button>
            ))}
        </div>
    )
}
