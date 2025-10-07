import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

describe("Dialog", () => {
    it("opens and renders content when triggered", () => {
        render(
            <Dialog>
                <DialogTrigger>Open</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Title</DialogTitle>
                        <DialogDescription>Description</DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        )
        const trigger = screen.getByText("Open")
        fireEvent.click(trigger)
        expect(screen.getByText("Title")).toBeInTheDocument()
        expect(screen.getByText("Description")).toBeInTheDocument()
    })
})
