import { getIconByName } from "@/lib/icons"
import { describe, expect, it } from "vitest"

describe("lib/icons", () => {
    it("returns react-icons for special names", () => {
        const yt = getIconByName("Youtube")
        expect(yt).toBeTruthy()
        const ps = getIconByName("SiAdobephotoshop")
        expect(ps).toBeTruthy()
    })

    it("returns lucide icon for standard names", () => {
        const activity = getIconByName("Activity")
        expect(activity).toBeTruthy()
    })
})
