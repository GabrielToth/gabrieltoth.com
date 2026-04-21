import { render, screen } from "@testing-library/react"
import { Button } from "./button"
import {
    Modal,
    ModalDescription,
    ModalFooter,
    ModalHeader,
    ModalTitle,
} from "./modal"

describe("Modal Component", () => {
    it("renders modal when isOpen is true", () => {
        render(
            <Modal isOpen={true} onClose={() => {}}>
                <ModalHeader>
                    <ModalTitle>Test Modal</ModalTitle>
                </ModalHeader>
                <div>Modal content</div>
            </Modal>
        )

        expect(screen.getByText("Test Modal")).toBeInTheDocument()
        expect(screen.getByText("Modal content")).toBeInTheDocument()
    })

    it("does not render modal when isOpen is false", () => {
        render(
            <Modal isOpen={false} onClose={() => {}}>
                <ModalHeader>
                    <ModalTitle>Test Modal</ModalTitle>
                </ModalHeader>
                <div>Modal content</div>
            </Modal>
        )

        expect(screen.queryByText("Test Modal")).not.toBeInTheDocument()
    })

    it("renders modal with description", () => {
        render(
            <Modal isOpen={true} onClose={() => {}}>
                <ModalHeader>
                    <ModalTitle>Test Modal</ModalTitle>
                    <ModalDescription>
                        This is a test description
                    </ModalDescription>
                </ModalHeader>
            </Modal>
        )

        expect(
            screen.getByText("This is a test description")
        ).toBeInTheDocument()
    })

    it("renders modal with footer", () => {
        render(
            <Modal isOpen={true} onClose={() => {}}>
                <ModalHeader>
                    <ModalTitle>Test Modal</ModalTitle>
                </ModalHeader>
                <ModalFooter>
                    <Button>Action</Button>
                </ModalFooter>
            </Modal>
        )

        expect(
            screen.getByRole("button", { name: "Action" })
        ).toBeInTheDocument()
    })

    it("has proper accessibility attributes", () => {
        render(
            <Modal isOpen={true} onClose={() => {}}>
                <ModalHeader>
                    <ModalTitle>Test Modal</ModalTitle>
                </ModalHeader>
            </Modal>
        )

        const dialog = screen.getByRole("dialog")
        expect(dialog).toBeInTheDocument()
    })
})
