"use client"

import * as React from "react"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from "./dialog"

/**
 * Modal component - A wrapper around Dialog for displaying modal dialogs
 *
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={onClose}>
 *   <Modal.Header>
 *     <Modal.Title>Confirm Action</Modal.Title>
 *   </Modal.Header>
 *   <Modal.Content>
 *     Are you sure?
 *   </Modal.Content>
 *   <Modal.Footer>
 *     <Button onClick={onClose}>Cancel</Button>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 */

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    className?: string
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
    ({ isOpen, onClose, children, className }, ref) => {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogPortal>
                    <DialogOverlay />
                    <DialogContent ref={ref} className={className}>
                        {children}
                    </DialogContent>
                </DialogPortal>
            </Dialog>
        )
    }
)

Modal.displayName = "Modal"

const ModalHeader = DialogHeader
const ModalFooter = DialogFooter
const ModalTitle = DialogTitle
const ModalDescription = DialogDescription
const ModalClose = DialogClose

export {
    Modal,
    ModalClose,
    ModalDescription,
    ModalFooter,
    ModalHeader,
    ModalTitle,
}
