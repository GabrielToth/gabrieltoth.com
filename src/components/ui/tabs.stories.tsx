import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Card, CardContent } from "./card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

const meta: Meta<typeof Tabs> = {
    title: "UI/Tabs",
    component: Tabs,
    tags: ["autodocs"],
    subcomponents: { TabsList, TabsTrigger, TabsContent }, // cspell:disable-line
    parameters: {
        docs: {
            description: {
                component:
                    "Tabs component for switching between different views. Includes Tabs, TabsList, TabsTrigger, and TabsContent subcomponents.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
    render: () => (
        <Tabs defaultValue="account" className="w-[400px]">
            <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
                <Card>
                    <CardContent className="space-y-2 pt-6">
                        <h3 className="text-lg font-medium">
                            Account Settings
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Manage your account settings and preferences.
                        </p>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="password">
                <Card>
                    <CardContent className="space-y-2 pt-6">
                        <h3 className="text-lg font-medium">
                            Password Settings
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Change your password and security settings.
                        </p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    ),
}

export const WithIcons: Story = {
    render: () => (
        <Tabs defaultValue="music" className="w-[400px]">
            <TabsList>
                <TabsTrigger value="music">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                    </svg>
                    Music
                </TabsTrigger>
                <TabsTrigger value="videos">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    Videos
                </TabsTrigger>
            </TabsList>
            <TabsContent value="music" className="mt-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Music Library</h3>
                    <p className="text-sm text-muted-foreground">
                        Browse and manage your music collection.
                    </p>
                </div>
            </TabsContent>
            <TabsContent value="videos" className="mt-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Video Library</h3>
                    <p className="text-sm text-muted-foreground">
                        Browse and manage your video collection.
                    </p>
                </div>
            </TabsContent>
        </Tabs>
    ),
}

export const WithForm: Story = {
    render: () => (
        <Tabs defaultValue="basics" className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="basics">
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="name"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Name
                            </label>
                            <input
                                id="name"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Enter your name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Enter your email"
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="advanced">
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="api-key"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                API Key
                            </label>
                            <input
                                id="api-key"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Enter your API key"
                            />
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="webhook"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Webhook URL
                            </label>
                            <input
                                id="webhook"
                                type="url"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Enter webhook URL"
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    ),
}
