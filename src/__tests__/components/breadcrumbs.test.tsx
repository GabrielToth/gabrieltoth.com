import Breadcrumbs from "@/components/ui/breadcrumbs"
import * as useLocaleModule from "@/hooks/use-locale"
import enEditors from "@/i18n/en/editors.json"
import enFooter from "@/i18n/en/layout.footer.json"
import enHeader from "@/i18n/en/layout.header.json"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({ usePathname: () => "/en/projects" }))

describe("Breadcrumbs", () => {
    it("auto generates breadcrumbs from pathname", () => {
        vi.spyOn(useLocaleModule, "useLocale").mockReturnValue({
            locale: "en",
            changeLocale: vi.fn(),
            isLoading: false,
        } as any)

        render(
            <NextIntlClientProvider
                locale="en"
                messages={{
                    layout: {
                        header: enHeader as any,
                        footer: enFooter as any,
                    },
                    editors: enEditors as any,
                }}
            >
                <Breadcrumbs />
            </NextIntlClientProvider>
        )
        expect(screen.getByText(/Home/i)).toBeInTheDocument()
        expect(screen.getByText(/Projects/i)).toBeInTheDocument()
    })
})
