import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import * as LanguageSelectorStories from "@/stories/LanguageSelector.stories"

// Mock App Router hooks used by use-locale
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => "/en",
}))
vi.mock("@/hooks/use-locale", () => ({
    useLocale: () => ({
        locale: "en",
        changeLocale: vi.fn(),
        isLoading: false,
    }),
}))
describe("stories/LanguageSelector.stories branches", () => {
    it("imports story meta and HeaderVariant story", () => {
        expect(LanguageSelectorStories.default).toBeTruthy()
        expect((LanguageSelectorStories as any).HeaderVariant).toBeTruthy()
    })

    it("renders HeaderVariant without crashing", () => {
        const Comp = (LanguageSelectorStories as any).HeaderVariant?.render
        const args = (LanguageSelectorStories as any).HeaderVariant?.args || {}
        if (Comp) {
            const { container } = render(Comp(args))
            expect(container).toBeTruthy()
        }
    })
})
