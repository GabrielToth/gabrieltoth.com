"use client"

import { fetchChannels, fetchPosts } from "@/lib/api"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { FilterBar } from "./FilterBar"
import { Post } from "./PostCard"
import { PostList } from "./PostList"

/**
 * SocialChannel type definition
 */
export interface SocialChannel {
    id: string
    platform: "facebook" | "instagram" | "twitter" | "tiktok" | "linkedin"
    accountId: string
    accountName: string
    isConnected: boolean
    connectedAt?: Date
}

/**
 * PublishContainerProps
 */
export interface PublishContainerProps {
    children?: React.ReactNode
}

/**
 * PublishContainer Component
 * Main container for Publish tab
 * Manages state for posts and filters
 * Can accept children or render FilterBar and PostList components
 *
 * Features:
 * - Manages post list state
 * - Manages filter state for social channels
 * - Provides filtering logic
 * - Handles post actions (edit, delete)
 * - API integration for fetching posts
 * - Loading and error states
 * - Data caching
 * - Responsive layout
 */
export const PublishContainer: React.FC<PublishContainerProps> = ({
    children,
}) => {
    // State management
    const [posts, setPosts] = useState<Post[]>([])
    const [availableChannels, setAvailableChannels] = useState<SocialChannel[]>(
        []
    )
    const [selectedChannels, setSelectedChannels] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    /**
     * Fetch posts from API
     */
    const handleFetchPosts = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const data = await fetchPosts()
            setPosts(data)
            setIsLoading(false)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to fetch posts"
            )
            setIsLoading(false)
        }
    }, [])

    /**
     * Fetch available channels from API
     */
    const handleFetchChannels = useCallback(async () => {
        try {
            const data = await fetchChannels()
            setAvailableChannels(data)
        } catch (err) {
            console.error("Failed to fetch channels:", err)
        }
    }, [])

    // Fetch data on mount
    useEffect(() => {
        handleFetchChannels()
        handleFetchPosts()
    }, [handleFetchChannels, handleFetchPosts])

    // Filtered posts based on selected channels
    const filteredPosts = useMemo(() => {
        if (selectedChannels.length === 0) {
            return posts
        }

        return posts.filter(post =>
            post.channels.some(channel => selectedChannels.includes(channel))
        )
    }, [posts, selectedChannels])

    // Sort posts by date (newest first)
    const sortedPosts = useMemo(() => {
        return [...filteredPosts].sort((a, b) => {
            const dateA = a.publishedAt || a.scheduledAt
            const dateB = b.publishedAt || b.scheduledAt
            return dateB.getTime() - dateA.getTime()
        })
    }, [filteredPosts])

    // Handle filter change
    const handleFilterChange = (channels: string[]) => {
        setSelectedChannels(channels)
    }

    // Handle edit post
    const handleEditPost = (post: Post) => {
        console.log("Edit post:", post)
        // TODO: Implement edit functionality
    }

    // Handle delete post
    const handleDeletePost = (post: Post) => {
        console.log("Delete post:", post)
        // TODO: Implement delete functionality
    }

    // Handle retry
    const handleRetry = () => {
        handleFetchPosts()
    }

    // If children are provided, render them
    if (children) {
        return <div className="space-y-6">{children}</div>
    }

    // Default render with FilterBar and PostList
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Publish
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600">
                        Manage and schedule your social media posts
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            {!isLoading && !error && (
                <FilterBar
                    channels={availableChannels}
                    selectedChannels={selectedChannels}
                    onFilterChange={handleFilterChange}
                />
            )}

            {/* Post Count */}
            {!isLoading && !error && sortedPosts.length > 0 && (
                <div className="text-xs sm:text-sm text-gray-600">
                    Showing {sortedPosts.length} of {posts.length} post
                    {posts.length !== 1 ? "s" : ""}
                </div>
            )}

            {/* Post List */}
            <PostList
                posts={sortedPosts}
                isLoading={isLoading}
                error={error}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                onRetry={handleRetry}
            />
        </div>
    )
}

export default PublishContainer
