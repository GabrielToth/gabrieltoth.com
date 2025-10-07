import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("components/ui/dialog coverage", () => {
    it("renders overlay, content and closes via button", async () => {
        const mod = await import("@/components/ui/dialog")
        const {
            Dialog,
            DialogTrigger,
            DialogContent,
            DialogTitle,
            DialogDescription,
            DialogHeader,
            DialogFooter,
        } = mod

        render(
            <Dialog>
                <DialogTrigger>open</DialogTrigger>
                <DialogContent>
                    <DialogHeader data-testid="hdr" />
                    <DialogTitle>Title</DialogTitle>
                    <DialogDescription>Desc</DialogDescription>
                    <DialogFooter data-testid="ftr" />
                </DialogContent>
            </Dialog>
        )

        fireEvent.click(screen.getByText("open"))
        expect(await screen.findByText("Title")).toBeTruthy()
        expect(screen.getByText("Desc")).toBeTruthy()
        expect(screen.getByTestId("hdr")).toBeInTheDocument()
        expect(screen.getByTestId("ftr")).toBeInTheDocument()

        // close button has sr-only text "Close"
        fireEvent.click(screen.getByText("Close"))
    })
})
