import type { Meta, StoryObj } from "@storybook/react"
import type { Post } from "./PostCard"
import { PostCard } from "./PostCard"

const meta = {
    title: "Publish/PostCard",
    component: PostCard,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof PostCard>

export default meta
type Story = StoryObj<typeof meta>

const scheduledPost: Post = {
    id: "1",
    title: "Upcoming Product Launch",
    content: "Excited to announce our new product launching next week!",
    scheduledAt: new Date(Date.now() + 86400000 * 3),
    status: "scheduled",
    channels: ["facebook", "instagram", "twitter"],
    createdAt: new Date(),
}

const publishedPost: Post = {
    id: "2",
    title: "Thank You for 1M Followers",
    content: "We reached 1 million followers! Thank you all for the support.",
    scheduledAt: new Date(Date.now() - 86400000),
    publishedAt: new Date(Date.now() - 86400000),
    status: "published",
    channels: ["instagram", "twitter"],
    createdAt: new Date(Date.now() - 172800000),
}

const failedPost: Post = {
    id: "3",
    title: "Failed Post",
    content: "This post failed to publish",
    scheduledAt: new Date(Date.now() - 43200000),
    status: "failed",
    channels: ["tiktok"],
    errorMessage: "Failed to connect to TikTok API",
    createdAt: new Date(Date.now() - 86400000),
}

export const Scheduled: Story = {
    args: {
        post: scheduledPost,
        onEdit: () => console.log("Edit clicked"),
        onDelete: () => console.log("Delete clicked"),
    },
}

export const Published: Story = {
    args: {
        post: publishedPost,
        onEdit: () => console.log("Edit clicked"),
        onDelete: () => console.log("Delete clicked"),
    },
}

export const Failed: Story = {
    args: {
        post: failedPost,
        onEdit: () => console.log("Edit clicked"),
        onDelete: () => console.log("Delete clicked"),
    },
}
