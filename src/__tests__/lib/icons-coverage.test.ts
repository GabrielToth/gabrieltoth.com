import { getIconByName } from "@/lib/icons"
import { describe, expect, it } from "vitest"

describe("lib/icons getIconByName", () => {
    it("returns react-icons for known aliases", () => {
        expect(getIconByName("SiAdobepremierepro")).toBeTruthy()
        expect(getIconByName("SiAdobeaftereffects")).toBeTruthy()
        expect(getIconByName("SiAdobephotoshop")).toBeTruthy()
        expect(getIconByName("Youtube")).toBeTruthy()
    })

    it("returns lucide icon by name when available", () => {
        // Use a very common Lucide icon name like 'Home'
        const icon = getIconByName("Home" as any)
        expect(icon).toBeTruthy()
    })
})
