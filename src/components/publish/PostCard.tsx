"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import React from "react"

export interface Post {
    id: string
    title: string
    content: string
    scheduledAt: Date
    publishedAt?: Date
    status: "scheduled" | "published" | "failed"
    channels: string[]
    errorMessage?: string
    createdAt: Date
}

export interface PostCardProps {
    post: Post
    onEdit: (post: Post) => void
    onDelete: (post: Post) => void
}

/**
 * PostCard Component
 * Displays individual post with title, date, status, channels, and actions
 *
 * Features:
 * - Display post title and content
 * - Show post status (scheduled, published, failed)
 * - Display target channels
 * - Show scheduled/published date
 * - Edit button (disabled for published posts)
 * - Delete button with confirmation
 * - Error message display for failed posts
 * - Responsive layout
 */
export const PostCard: React.FC<PostCardProps> = ({
    post,
    onEdit,
    onDelete,
}) => {
    const t = useTranslations("dashboard.publish")
    const isPublished = post.status === "published"
    const isFailed = post.status === "failed"
    const isScheduled = post.status === "scheduled"

    const getStatusColor = (status: string) => {
        switch (status) {
            case "scheduled":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
            case "published":
                return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
            case "failed":
                return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date))
    }

    return (
        <Card className="hover:shadow-md transition-shadow dark:border-gray-700">
            <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 truncate text-base sm:text-base dark:text-white">
                            {post.title}
                        </h3>

                        {/* Content Preview */}
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2 dark:text-gray-300">
                            {post.content}
                        </p>

                        {/* Status and Channel Badges */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {/* Status Badge */}
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(post.status)}`}
                            >
                                {post.status}
                            </span>

                            {/* Channel Badges */}
                            {post.channels.map(channel => (
                                <span
                                    key={channel}
                                    className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 capitalize dark:bg-gray-700 dark:text-gray-300"
                                >
                                    {channel}
                                </span>
                            ))}
                        </div>

                        {/* Date and Error Info */}
                        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {isPublished && post.publishedAt && (
                                <p>
                                    {t("published")}
                                    {formatDate(post.publishedAt)}
                                </p>
                            )}
                            {isScheduled && (
                                <p>
                                    {t("scheduled")}
                                    {formatDate(post.scheduledAt)}
                                </p>
                            )}
                            {isFailed && post.errorMessage && (
                                <p className="text-red-600 dark:text-red-400">
                                    {t("error")}
                                    {post.errorMessage}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0 mt-3 sm:mt-0">
                        <Button
                            variant={isPublished ? "ghost" : "outline"}
                            size="sm"
                            onClick={() => onEdit(post)}
                            disabled={isPublished}
                            title={
                                isPublished
                                    ? t("cannotEditPublished")
                                    : t("edit")
                            }
                            className={`min-h-10 min-w-10 ${
                                isPublished
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            {t("edit")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(post)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 min-h-10 min-w-10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 dark:border-red-800"
                        >
                            {t("delete")}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default PostCard
