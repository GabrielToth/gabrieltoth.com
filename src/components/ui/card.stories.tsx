import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import Image from "next/image"
import { Button } from "./button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./card"

const meta: Meta<typeof Card> = {
    title: "UI/Card",
    component: Card,
    tags: ["autodocs"],
    subcomponents: { CardHeader, CardContent, CardFooter }, // cspell:disable-line
    parameters: {
        docs: {
            description: {
                component:
                    "Card components for building content containers. Includes Card, CardHeader, CardTitle, CardDescription, CardContent, and CardFooter subcomponents.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
    render: () => (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Card content with any elements you want to include.</p>
            </CardContent>
            <CardFooter>
                <Button>Action</Button>
            </CardFooter>
        </Card>
    ),
}

export const SimpleCard: Story = {
    render: () => (
        <Card className="w-[350px]">
            <CardContent className="pt-6">
                <p>A simple card with just content.</p>
            </CardContent>
        </Card>
    ),
}

export const WithImage: Story = {
    render: () => (
        <Card className="w-[350px]">
            <Image
                src="https://via.placeholder.com/350x200"
                alt="Example"
                width={350}
                height={200}
                className="w-full h-[200px] object-cover"
            />
            <CardHeader>
                <CardTitle>Featured Content</CardTitle>
                <CardDescription>With a beautiful header image</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Content that relates to the image above.</p>
            </CardContent>
        </Card>
    ),
}

export const Interactive: Story = {
    render: () => (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>With multiple actions</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Content that requires user interaction.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Continue</Button>
            </CardFooter>
        </Card>
    ),
}

export const Loading: Story = {
    render: () => (
        <Card className="w-[350px]">
            <CardHeader>
                <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                </div>
            </CardContent>
        </Card>
    ),
}
