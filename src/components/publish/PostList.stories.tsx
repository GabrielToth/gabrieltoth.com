import type { Meta, StoryObj } from "@storybook/react"
import type { Post } from "./PostCard"
import { PostList } from "./PostList"

const meta = {
    title: "Publish/PostList",
    component: PostList,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof PostList>

export default meta
type Story = StoryObj<typeof meta>

const mockPosts: Post[] = [
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
]

export const Default: Story = {
    args: {
        posts: mockPosts,
        onEdit: () => console.log("Edit clicked"),
        onDelete: () => console.log("Delete clicked"),
    },
}

export const Loading: Story = {
    args: {
        posts: [],
        isLoading: true,
        onEdit: () => console.log("Edit clicked"),
        onDelete: () => console.log("Delete clicked"),
    },
}

export const Error: Story = {
    args: {
        posts: [],
        error: "Failed to load posts. Please try again.",
        onEdit: () => console.log("Edit clicked"),
        onDelete: () => console.log("Delete clicked"),
        onRetry: () => console.log("Retry clicked"),
    },
}

export const Empty: Story = {
    args: {
        posts: [],
        onEdit: () => console.log("Edit clicked"),
        onDelete: () => console.log("Delete clicked"),
    },
}
