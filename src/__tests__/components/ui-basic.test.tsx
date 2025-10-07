import { DynamicIcon } from "@/components/ui/dynamic-icon"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { render, screen } from "@testing-library/react"
import { Activity } from "lucide-react"
import { describe, expect, it } from "vitest"

describe("UI basics", () => {
    it("renders Input, Label, Textarea, Separator", () => {
        render(
            <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
                <Textarea placeholder="Message" />
                <Separator />
            </div>
        )
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/message/i)).toBeInTheDocument()
    })

    it("renders Icon and DynamicIcon", () => {
        render(
            <div>
                <Icon icon={Activity} />
                <DynamicIcon name="Activity" />
            </div>
        )
        // If render passes without error, it's good; no further DOM text
        expect(true).toBe(true)
    })
})
