"use client"

import { Card, CardContent } from "@/components/ui/card"
import React from "react"
import { Post, PostCard } from "./PostCard"

export interface PostListProps {
    posts: Post[]
    isLoading?: boolean
    error?: string | null
    onEdit: (post: Post) => void
    onDelete: (post: Post) => void
    onRetry?: () => void
}

/**
 * PostList Component
 * Container for displaying multiple posts
 *
 * Features:
 * - Display list of PostCard components
 * - Show loading skeleton when loading
 * - Display error message with retry option
 * - Show empty state when no posts
 * - Responsive layout
 */
export const PostList: React.FC<PostListProps> = ({
    posts,
    isLoading = false,
    error = null,
    onEdit,
    onDelete,
    onRetry,
}) => {
    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-full" />
                                <div className="h-3 bg-gray-200 rounded w-2/3" />
                                <div className="flex gap-2 pt-2">
                                    <div className="h-6 bg-gray-200 rounded-full w-20" />
                                    <div className="h-6 bg-gray-200 rounded-full w-24" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div>
                            <h3 className="font-semibold text-red-900">
                                Error loading posts
                            </h3>
                            <p className="mt-1 text-xs sm:text-sm text-red-700">
                                {error}
                            </p>
                        </div>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="shrink-0 rounded-md bg-red-100 px-3 py-2 text-xs sm:text-sm font-medium text-red-700 hover:bg-red-200 transition-colors min-h-10"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Empty state
    if (posts.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-gray-600">No posts found</p>
                    <p className="mt-1 text-sm text-gray-500">
                        Create your first post to get started
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Posts list
    return (
        <div className="space-y-4">
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}

export default PostList
