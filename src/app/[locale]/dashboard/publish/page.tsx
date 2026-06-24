"use client"

import CalendarView from "@/components/publish/CalendarView"
import PostingInterface from "@/components/publish/PostingInterface"
import { PostList } from "@/components/publish/PostList"
import { Post } from "@/components/publish/PostCard"
import { UniversalPostingButton } from "@/components/publish"
import { useLocale, useTranslations } from "next-intl"
import { format } from "date-fns"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"

function getLocalTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
        return "UTC"
    }
}

function getStoredTimezone(): string {
    if (typeof window === "undefined") return "UTC"
    try {
        return localStorage.getItem("user-timezone") || getLocalTimezone()
    } catch {
        return getLocalTimezone()
    }
}

export default function PublishPage() {
    const t = useTranslations("dashboard.publish")
    const locale = useLocale()
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [showPostingInterface, setShowPostingInterface] = useState(false)
    const [interfaceDate, setInterfaceDate] = useState<Date | undefined>()

    const fetchPosts = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            const res = await fetch("/api/posts")
            if (!res.ok) {
                const text = await res.text()
                let msg = t("failedToFetch")
                try {
                    const data = JSON.parse(text)
                    msg = data.error || msg
                } catch {}
                throw new Error(msg)
            }
            const data = await res.json()
            const mapped: Post[] = (data.posts || []).map((p: any) => ({
                id: p.id,
                title: p.content.slice(0, 80),
                content: p.content,
                scheduledAt: new Date(p.scheduledTime),
                publishedAt: p.publishedAt
                    ? new Date(p.publishedAt)
                    : undefined,
                status:
                    p.status === "published"
                        ? "published"
                        : p.status === "failed"
                          ? "failed"
                          : "scheduled",
                channels: (p.networks || []).map((n: any) =>
                    typeof n === "string" ? n : n.platform || ""
                ),
                errorMessage: p.errorMessage,
                createdAt: new Date(p.createdAt),
            }))
            setPosts(mapped)
        } catch (err) {
            setError(err instanceof Error ? err.message : t("failedToFetch"))
        } finally {
            setIsLoading(false)
        }
    }, [t])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    const handleSelectDate = useCallback((date: Date) => {
        setSelectedDate(date)
        setInterfaceDate(date)
        setShowPostingInterface(true)
    }, [])

    const handleCloseInterface = useCallback(() => {
        setShowPostingInterface(false)
        setInterfaceDate(undefined)
        fetchPosts()
    }, [fetchPosts])

    const handleNewPost = useCallback(() => {
        setInterfaceDate(undefined)
        setShowPostingInterface(true)
    }, [])

    const handleEditPost = useCallback((post: Post) => {
        setInterfaceDate(post.scheduledAt)
        setShowPostingInterface(true)
    }, [])

    const handleDeletePost = useCallback(
        async (post: Post) => {
            if (!confirm(t("deleteConfirm"))) return
            try {
                const res = await fetch(`/api/posts/${post.id}`, {
                    method: "DELETE",
                })
                if (!res.ok) throw new Error("Failed to delete post")
                fetchPosts()
            } catch (err) {
                console.error("Failed to delete post:", err)
            }
        },
        [fetchPosts]
    )

    const filteredPosts = useMemo(() => {
        if (!selectedDate) return posts
        const dateKey = format(selectedDate, "yyyy-MM-dd")
        return posts.filter(p => {
            const postKey = format(p.scheduledAt, "yyyy-MM-dd")
            return postKey === dateKey
        })
    }, [posts, selectedDate])

    const calendarPosts = useMemo(
        () =>
            posts
                .filter(p => p.status === "scheduled")
                .map(p => ({
                    id: p.id,
                    scheduledTime: p.scheduledAt.getTime(),
                })),
        [posts]
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {t("title")}
                    </h1>
                    <p className="mt-2 text-gray-600">{t("description")}</p>
                </div>
                <UniversalPostingButton
                    linkedNetworksCount={3}
                    onOpen={handleNewPost}
                />
            </div>

            <CalendarView
                posts={calendarPosts}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
            />

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {selectedDate
                            ? t("postsFor", {
                                  date: format(selectedDate, "MMM d, yyyy"),
                              })
                            : t("allScheduledPosts")}
                    </h2>
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            {t("clearFilter")}
                        </button>
                    )}
                </div>
                <PostList
                    posts={filteredPosts}
                    isLoading={isLoading}
                    error={error}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                    onRetry={fetchPosts}
                />
            </div>

            {showPostingInterface && (
                <PostingInterface
                    onClose={handleCloseInterface}
                    defaultDate={interfaceDate}
                />
            )}
        </div>
    )
}
