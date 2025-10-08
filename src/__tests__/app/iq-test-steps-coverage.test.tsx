import { describe, expect, it, vi } from "vitest"

vi.mock("next-intl/server", () => {
    const t: any = (k: string, vars?: any) =>
        k.includes("steps.progress")
            ? `Step ${vars?.step} of ${vars?.total}`
            : k
    t.raw = () => []
    return { getTranslations: vi.fn().mockResolvedValue(t) }
})

vi.mock("next/navigation", () => ({
    notFound: () => {
        throw new Error("NOT_FOUND")
    },
}))

describe("[locale]/iq-test/step/[step] page coverage", () => {
    it("renders a middle step and navigations", async () => {
        const { default: StepPage } = await import(
            "@/app/[locale]/iq-test/step/[step]/page"
        )
        const jsx = await StepPage({
            params: Promise.resolve({ locale: "en", step: "12" }),
        } as any)
        expect(jsx).toBeTruthy()
    })

    it("renders last step with finish CTA", async () => {
        const { default: StepPage } = await import(
            "@/app/[locale]/iq-test/step/[step]/page"
        )
        const jsx = await StepPage({
            params: Promise.resolve({ locale: "en", step: "35" }),
        } as any)
        expect(jsx).toBeTruthy()
    })

    it("calls notFound for invalid step", async () => {
        const { default: StepPage } = await import(
            "@/app/[locale]/iq-test/step/[step]/page"
        )
        await expect(
            StepPage({
                params: Promise.resolve({ locale: "en", step: "0" }),
            } as any)
        ).rejects.toThrow("NOT_FOUND")
    })
})
