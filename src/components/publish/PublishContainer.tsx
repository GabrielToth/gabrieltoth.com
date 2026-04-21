"use client"

import React, { useMemo, useState } from "react"

/**
 * Post type definition
 */
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
 * - Responsive layout
 */
export const PublishContainer: React.FC<PublishContainerProps> = ({
    children,
}) => {
    // Mock data - in production, this would come from an API
    const [posts] = useState<Post[]>([
        {
            id: "1",
            title: "First Post",
            content: "This is the first post",
            scheduledAt: new Date(Date.now() + 86400000),
            status: "scheduled",
            channels: ["facebook", "instagram"],
            createdAt: new Date(),
        },
        {
            id: "2",
            title: "Published Post",
            content: "This post has been published",
            scheduledAt: new Date(Date.now() - 86400000),
            publishedAt: new Date(Date.now() - 86400000),
            status: "published",
            channels: ["twitter"],
            createdAt: new Date(Date.now() - 172800000),
        },
        {
            id: "3",
            title: "Failed Post",
            content: "This post failed to publish",
            scheduledAt: new Date(Date.now() - 43200000),
            status: "failed",
            channels: ["tiktok"],
            errorMessage: "Failed to connect to TikTok API",
            createdAt: new Date(Date.now() - 86400000),
        },
    ])

    const [availableChannels] = useState<SocialChannel[]>([
        {
            id: "1",
            platform: "facebook",
            accountId: "fb123",
            accountName: "My Facebook Page",
            isConnected: true,
        },
        {
            id: "2",
            platform: "instagram",
            accountId: "ig123",
            accountName: "My Instagram",
            isConnected: true,
        },
        {
            id: "3",
            platform: "twitter",
            accountId: "tw123",
            accountName: "My Twitter",
            isConnected: true,
        },
        {
            id: "4",
            platform: "tiktok",
            accountId: "tt123",
            accountName: "My TikTok",
            isConnected: false,
        },
        {
            id: "5",
            platform: "linkedin",
            accountId: "li123",
            accountName: "My LinkedIn",
            isConnected: true,
        },
    ])

    // Filter state
    const [selectedChannels, setSelectedChannels] = useState<string[]>([])

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

    // If children are provided, render them
    if (children) {
        return <div className="space-y-6">{children}</div>
    }

    // Default render with FilterBar and PostList
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Publish
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage and schedule your social media posts
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Filter by Channel
                        </label>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {availableChannels.map(channel => (
                                <button
                                    key={channel.id}
                                    onClick={() => {
                                        setSelectedChannels(prev =>
                                            prev.includes(channel.platform)
                                                ? prev.filter(
                                                      c =>
                                                          c !== channel.platform
                                                  )
                                                : [...prev, channel.platform]
                                        )
                                    }}
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                                        selectedChannels.includes(
                                            channel.platform
                                        )
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    } ${!channel.isConnected ? "opacity-50" : ""}`}
                                    disabled={!channel.isConnected}
                                    title={
                                        !channel.isConnected
                                            ? "Channel not connected"
                                            : undefined
                                    }
                                >
                                    {channel.accountName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedChannels.length > 0 && (
                        <button
                            onClick={() => setSelectedChannels([])}
                            className="w-fit text-sm text-blue-600 hover:text-blue-700"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Post Count */}
            <div className="text-sm text-gray-600">
                Showing {sortedPosts.length} of {posts.length} posts
            </div>

            {/* Post List */}
            <div className="space-y-4">
                {sortedPosts.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                        <p className="text-gray-600">No posts found</p>
                    </div>
                ) : (
                    sortedPosts.map(post => (
                        <div
                            key={post.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">
                                        {post.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {post.content}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {/* Status Badge */}
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                post.status === "scheduled"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : post.status ===
                                                        "published"
                                                      ? "bg-green-100 text-green-800"
                                                      : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {post.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                post.status.slice(1)}
                                        </span>

                                        {/* Channel Badges */}
                                        {post.channels.map(channel => (
                                            <span
                                                key={channel}
                                                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                                            >
                                                {channel
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    channel.slice(1)}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Date and Error Info */}
                                    <div className="mt-3 text-xs text-gray-500">
                                        {post.status === "published" &&
                                            post.publishedAt && (
                                                <p>
                                                    Published:{" "}
                                                    {post.publishedAt.toLocaleDateString()}{" "}
                                                    {post.publishedAt.toLocaleTimeString()}
                                                </p>
                                            )}
                                        {post.status === "scheduled" && (
                                            <p>
                                                Scheduled:{" "}
                                                {post.scheduledAt.toLocaleDateString()}{" "}
                                                {post.scheduledAt.toLocaleTimeString()}
                                            </p>
                                        )}
                                        {post.status === "failed" &&
                                            post.errorMessage && (
                                                <p className="text-red-600">
                                                    Error: {post.errorMessage}
                                                </p>
                                            )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditPost(post)}
                                        disabled={post.status === "published"}
                                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                            post.status === "published"
                                                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                        }`}
                                        title={
                                            post.status === "published"
                                                ? "Cannot edit published posts"
                                                : "Edit post"
                                        }
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeletePost(post)}
                                        className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default PublishContainer
