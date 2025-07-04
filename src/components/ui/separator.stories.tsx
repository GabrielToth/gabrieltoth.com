import type { Meta, StoryObj } from "@storybook/react"
import { Separator } from "./separator"

const meta: Meta<typeof Separator> = {
    title: "UI/Separator",
    component: Separator,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Separator component for visually or semantically separating content.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Separator>

export const Default: Story = {
    render: () => (
        <div>
            <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none">Section 1</h4>
                <p className="text-sm text-muted-foreground">
                    Description for section 1
                </p>
            </div>
            <Separator className="my-4" />
            <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none">Section 2</h4>
                <p className="text-sm text-muted-foreground">
                    Description for section 2
                </p>
            </div>
        </div>
    ),
}

export const Vertical: Story = {
    render: () => (
        <div className="flex h-5 items-center space-x-4 text-sm">
            <div>Item 1</div>
            <Separator orientation="vertical" />
            <div>Item 2</div>
            <Separator orientation="vertical" />
            <div>Item 3</div>
        </div>
    ),
}

export const WithDecorative: Story = {
    render: () => (
        <div className="space-y-8">
            <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none">
                    Main Content
                </h4>
                <p className="text-sm text-muted-foreground">
                    Primary content description
                </p>
            </div>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Additional Information
                    </span>
                </div>
            </div>
            <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none">
                    Secondary Content
                </h4>
                <p className="text-sm text-muted-foreground">
                    Secondary content description
                </p>
            </div>
        </div>
    ),
}

export const InCard: Story = {
    render: () => (
        <div className="space-y-4 rounded-md border p-4">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Card Title</h4>
                <p className="text-sm text-muted-foreground">
                    Card description
                </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Details</p>
                    <p className="text-sm text-muted-foreground">
                        View more information
                    </p>
                </div>
                <button className="text-sm underline">View</button>
            </div>
        </div>
    ),
}
