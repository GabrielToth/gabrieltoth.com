import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "./button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./dialog"

const meta: Meta<typeof Dialog> = {
    title: "UI/Dialog",
    component: Dialog,
    tags: ["autodocs"],
    parameters: {
        docs: {
            description: {
                component:
                    "Dialog component for creating modal dialogs. Includes Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, and DialogFooter subcomponents.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Default: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Dialog Title</DialogTitle>
                    <DialogDescription>
                        This is a description of the dialog content and purpose.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p>
                        Dialog content goes here. You can add any elements you
                        need.
                    </p>
                </div>
                <DialogFooter>
                    <Button>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

export const Confirmation: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary">Delete Item</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-3">
                    <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogTrigger>
                    <Button variant="secondary">Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

export const Form: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="name" className="text-right">
                            Name
                        </label>
                        <input
                            id="name"
                            className="col-span-3 h-10 rounded-md border border-input px-3"
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="email" className="text-right">
                            Email
                        </label>
                        <input
                            id="email"
                            className="col-span-3 h-10 rounded-md border border-input px-3"
                            placeholder="Enter your email"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}
