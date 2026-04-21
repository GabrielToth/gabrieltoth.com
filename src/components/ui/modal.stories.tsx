import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { Button } from "./button"
import {
    Modal,
    ModalDescription,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from "./modal"

const meta = {
    title: "UI/Modal",
    component: Modal,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false)

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                    <ModalHeader>
                        <ModalTitle>Modal Title</ModalTitle>
                    </ModalHeader>
                    <div className="py-4">
                        <p>This is the modal content.</p>
                    </div>
                    <ModalFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={() => setIsOpen(false)}>
                            Confirm
                        </Button>
                    </ModalFooter>
                </Modal>
            </>
        )
    },
}

export const WithDescription: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false)

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                    <ModalHeader>
                        <ModalTitle>Confirm Action</ModalTitle>
                        <ModalDescription>
                            Are you sure you want to proceed with this action?
                        </ModalDescription>
                    </ModalHeader>
                    <div className="py-4">
                        <p>This action cannot be undone.</p>
                    </div>
                    <ModalFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => setIsOpen(false)}
                        >
                            Confirm
                        </Button>
                    </ModalFooter>
                </Modal>
            </>
        )
    },
}

export const Danger: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false)

        return (
            <>
                <Button variant="outline" onClick={() => setIsOpen(true)}>
                    Delete Item
                </Button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                    <ModalHeader>
                        <ModalTitle>Delete Item</ModalTitle>
                        <ModalDescription>
                            This action cannot be undone. This will permanently
                            delete the item.
                        </ModalDescription>
                    </ModalHeader>
                    <ModalFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => setIsOpen(false)}
                        >
                            Delete
                        </Button>
                    </ModalFooter>
                </Modal>
            </>
        )
    },
}
