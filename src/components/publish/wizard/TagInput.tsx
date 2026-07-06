"use client"

import { Input } from "@/components/ui/input"
import { X, PencilLine } from "lucide-react"
import { useRef, useState, useCallback, useEffect } from "react"

interface TagInputProps {
    tags: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    maxChars?: number
    disabled?: boolean
}

export default function TagInput({
    tags,
    onChange,
    placeholder = "Type a tag and press Enter, or separate with commas",
    maxChars = 500,
    disabled = false,
}: TagInputProps) {
    const [inputValue, setInputValue] = useState("")
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editValue, setEditValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const editInputRef = useRef<HTMLInputElement>(null)

    const totalChars = tags.join("").length + tags.length - 1 // commas between
    const charsUsed = tags.length > 0 ? tags.join(",").length : 0
    const isAtLimit = charsUsed >= maxChars

    // Focus edit input when editing starts
    useEffect(() => {
        if (editingIndex !== null && editInputRef.current) {
            editInputRef.current.focus()
            editInputRef.current.select()
        }
    }, [editingIndex])

    const addTag = useCallback(
        (raw: string) => {
            const tag = raw.trim()
            if (!tag) return

            // Check if total chars would exceed limit
            const currentChars = tags.join(",").length
            const newChars =
                currentChars + (currentChars > 0 ? 1 : 0) + tag.length
            if (newChars > maxChars) return

            // Don't add duplicates
            if (tags.some(t => t.toLowerCase() === tag.toLowerCase())) return

            onChange([...tags, tag])
        },
        [tags, onChange, maxChars]
    )

    const removeTag = useCallback(
        (index: number) => {
            onChange(tags.filter((_, i) => i !== index))
        },
        [tags, onChange]
    )

    const startEditing = useCallback(
        (index: number) => {
            setEditingIndex(index)
            setEditValue(tags[index])
        },
        [tags]
    )

    const finishEditing = useCallback(() => {
        if (editingIndex === null) return

        const newTag = editValue.trim()
        if (newTag) {
            const newTags = [...tags]
            // Check total chars would be within limit
            const oldChars = tags.join(",").length
            const newCharsList = [...tags]
            newCharsList[editingIndex] = newTag
            const newCharsTotal = newCharsList.join(",").length
            if (newCharsTotal <= maxChars) {
                newTags[editingIndex] = newTag
                onChange(newTags)
            }
        } else {
            // If empty, remove the tag
            removeTag(editingIndex)
        }

        setEditingIndex(null)
        setEditValue("")
    }, [editingIndex, editValue, tags, onChange, maxChars, removeTag])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()

            const value = inputValue

            // Split by comma (for pasted content with commas)
            const parts = value
                .split(",")
                .map(p => p.trim())
                .filter(Boolean)

            if (parts.length > 0) {
                for (const part of parts) {
                    addTag(part)
                }
                setInputValue("")
            }
        } else if (
            e.key === "Backspace" &&
            inputValue === "" &&
            tags.length > 0
        ) {
            // Remove the last tag when backspacing on empty input
            removeTag(tags.length - 1)
        }
    }

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            finishEditing()
        } else if (e.key === "Escape") {
            setEditingIndex(null)
            setEditValue("")
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData("text")
        if (pasted.includes(",")) {
            e.preventDefault()
            const parts = pasted
                .split(",")
                .map(p => p.trim())
                .filter(Boolean)
            if (parts.length > 1) {
                for (const part of parts) {
                    addTag(part)
                }
            } else {
                setInputValue(prev => prev + pasted)
            }
        }
    }

    return (
        <div className="space-y-2">
            <div
                className={`flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm ring-offset-white focus-within:ring-2 focus-within:ring-neutral-950 focus-within:ring-offset-2 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus-within:ring-neutral-300 ${
                    disabled ? "cursor-not-allowed opacity-50" : ""
                } ${
                    isAtLimit
                        ? "border-amber-300 dark:border-amber-700"
                        : "border-neutral-200 dark:border-neutral-800"
                }`}
            >
                {/* Tag pills */}
                {tags.map((tag, index) => (
                    <div
                        key={`${tag}-${index}`}
                        className="group inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-sm text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-800/50"
                    >
                        {editingIndex === index ? (
                            <input
                                ref={editInputRef}
                                type="text"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                onBlur={finishEditing}
                                className="w-20 bg-transparent outline-none"
                                size={Math.max(editValue.length || 3, 3)}
                            />
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => startEditing(index)}
                                    className="flex items-center gap-0.5 hover:underline"
                                    title="Click to edit"
                                >
                                    <span>{tag}</span>
                                    <PencilLine className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeTag(index)}
                                    className="ml-0.5 rounded-full p-0.5 text-blue-600 hover:bg-blue-300 hover:text-blue-900 dark:text-blue-300 dark:hover:bg-blue-700 dark:hover:text-blue-100"
                                    aria-label={`Remove tag "${tag}"`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </>
                        )}
                    </div>
                ))}

                {/* Input field */}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={tags.length === 0 ? placeholder : ""}
                    disabled={disabled || isAtLimit}
                    className="min-w-[80px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-neutral-400 focus:ring-0 disabled:cursor-not-allowed dark:placeholder:text-neutral-500"
                />
            </div>

            {/* Counter and hint */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">
                    {isAtLimit
                        ? "Maximum character limit reached"
                        : "Press Enter or comma to add tags. Click a tag to edit."}
                </span>
                <span
                    className={`font-medium ${
                        charsUsed >= maxChars
                            ? "text-red-500"
                            : charsUsed >= maxChars * 0.9
                              ? "text-amber-500"
                              : "text-neutral-400"
                    }`}
                >
                    {charsUsed}/{maxChars} characters
                </span>
            </div>
        </div>
    )
}
