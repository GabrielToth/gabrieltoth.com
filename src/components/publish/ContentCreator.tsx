"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Bold, Italic, Link2, Underline, X } from "lucide-react"
import React, { useCallback, useState } from "react"

interface ContentCreatorProps {
    onContentChange: (content: {
        text: string
        images: File[]
        urls: string[]
        draft?: boolean
    }) => void
    platformLimits?: Record<string, number>
}

const PLATFORM_LIMITS: Record<string, number> = {
    twitter: 280,
    facebook: 63206,
    instagram: 2200,
    linkedin: 3000,
    youtube: 5000,
}

export default function ContentCreator({
    onContentChange,
    platformLimits = PLATFORM_LIMITS,
}: ContentCreatorProps) {
    const [text, setText] = useState("")
    const [images, setImages] = useState<File[]>([])
    const [urls, setUrls] = useState<string[]>([])
    const [urlInput, setUrlInput] = useState("")
    const [isDraft, setIsDraft] = useState(false)
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

    const characterCount = text.length
    const maxLimit =
        selectedPlatforms.length > 0
            ? Math.min(...selectedPlatforms.map(p => platformLimits[p] || 5000))
            : 5000

    const isOverLimit = characterCount > maxLimit

    const handleImageUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || [])
            setImages(prev => [...prev, ...files])
            onContentChange({
                text,
                images: [...images, ...files],
                urls,
                draft: isDraft,
            })
        },
        [text, images, urls, isDraft, onContentChange]
    )

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index)
        setImages(newImages)
        onContentChange({
            text,
            images: newImages,
            urls,
            draft: isDraft,
        })
    }

    const addUrl = () => {
        if (urlInput.trim() && !urls.includes(urlInput.trim())) {
            const newUrls = [...urls, urlInput.trim()]
            setUrls(newUrls)
            setUrlInput("")
            onContentChange({
                text,
                images,
                urls: newUrls,
                draft: isDraft,
            })
        }
    }

    const removeUrl = (index: number) => {
        const newUrls = urls.filter((_, i) => i !== index)
        setUrls(newUrls)
        onContentChange({
            text,
            images,
            urls: newUrls,
            draft: isDraft,
        })
    }

    const handleTextChange = (newText: string) => {
        setText(newText)
        onContentChange({
            text: newText,
            images,
            urls,
            draft: isDraft,
        })
    }

    const applyFormatting = (before: string, after: string = "") => {
        const textarea = document.getElementById(
            "content-textarea"
        ) as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = text.substring(start, end)
        const newText =
            text.substring(0, start) +
            before +
            selectedText +
            after +
            text.substring(end)

        handleTextChange(newText)
    }

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
                <h3 className="font-semibold">Create Content</h3>
                <p className="text-sm text-gray-600">
                    Compose your post with text, images, and links
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="content-textarea">Content</Label>
                <div className="space-y-2">
                    <div className="flex gap-1 rounded border bg-gray-50 p-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => applyFormatting("**", "**")}
                            title="Bold"
                            aria-label="Bold"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => applyFormatting("*", "*")}
                            title="Italic"
                            aria-label="Italic"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => applyFormatting("__", "__")}
                            title="Underline"
                            aria-label="Underline"
                        >
                            <Underline className="h-4 w-4" />
                        </Button>
                        <div className="border-l" />
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => applyFormatting("[", "](url)")}
                            title="Link"
                            aria-label="Link"
                        >
                            <Link2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <Textarea
                        id="content-textarea"
                        placeholder="What's on your mind?"
                        value={text}
                        onChange={e => handleTextChange(e.target.value)}
                        className="min-h-32 resize-none"
                        aria-label="Post content"
                    />

                    <div className="flex items-center justify-between">
                        <span
                            className={`text-sm ${
                                isOverLimit
                                    ? "text-red-600 font-semibold"
                                    : "text-gray-600"
                            }`}
                            aria-live="polite"
                        >
                            {characterCount} / {maxLimit} characters
                        </span>
                        {isOverLimit && (
                            <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">
                                    Exceeds platform limit
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="image-upload">Images</Label>
                <Input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    aria-label="Upload images"
                />
                {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative">
                                <img
                                    src={URL.createObjectURL(img)}
                                    alt={`Upload ${idx + 1}`}
                                    className="h-20 w-full rounded object-cover"
                                />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                    aria-label={`Remove image ${idx + 1}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="url-input">Add URLs</Label>
                <div className="flex gap-2">
                    <Input
                        id="url-input"
                        type="url"
                        placeholder="https://example.com"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyPress={e => e.key === "Enter" && addUrl()}
                        aria-label="URL input"
                    />
                    <Button onClick={addUrl} variant="outline">
                        Add
                    </Button>
                </div>
                {urls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {urls.map((url, idx) => (
                            <Badge
                                key={idx}
                                variant="secondary"
                                className="gap-2"
                            >
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate hover:underline"
                                >
                                    {url}
                                </a>
                                <button
                                    onClick={() => removeUrl(idx)}
                                    aria-label={`Remove URL ${idx + 1}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="draft"
                    checked={isDraft}
                    onChange={e => {
                        setIsDraft(e.target.checked)
                        onContentChange({
                            text,
                            images,
                            urls,
                            draft: e.target.checked,
                        })
                    }}
                    aria-label="Save as draft"
                />
                <Label htmlFor="draft" className="cursor-pointer">
                    Save as Draft
                </Label>
            </div>
        </div>
    )
}
