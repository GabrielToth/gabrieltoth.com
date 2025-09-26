import ContactSection from "@/app/[locale]/home/contact-section"
import * as useLocaleModule from "@/hooks/use-locale"
import enHome from "@/i18n/en/home.json"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("ContactSection", () => {
    beforeEach(() => {
        vi.spyOn(useLocaleModule, "useLocale").mockReturnValue({
            locale: "en",
            changeLocale: vi.fn(),
            isLoading: false,
        } as any)
    })

    it("renders required fields and submit button", () => {
        render(
            <NextIntlClientProvider
                locale="en"
                messages={{ home: enHome as any }}
            >
                <ContactSection />
            </NextIntlClientProvider>
        )

        expect(screen.getByTestId("contact-name")).toBeInTheDocument()
        expect(screen.getByTestId("contact-email")).toBeInTheDocument()
        expect(screen.getByTestId("contact-subject")).toBeInTheDocument()
        expect(screen.getByTestId("contact-message")).toBeInTheDocument()
        expect(screen.getByTestId("contact-submit")).toBeInTheDocument()
    })
})
