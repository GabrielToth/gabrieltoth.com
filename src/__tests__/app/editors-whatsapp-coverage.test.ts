import { describe, expect, it } from "vitest"

describe("editors whatsapp template coverage", () => {
    it("returns pt-BR and en templates", async () => {
        const { getApplicationTemplate } =
            await import("@/app/[locale]/editors/editors-whatsapp")
        const pt = getApplicationTemplate("pt-BR")
        const en = getApplicationTemplate("en")
        expect(pt).toMatch(/FORMULÁRIO|APPLICATION/)
        expect(en).toMatch(/APPLICATION/)
    })
})
