import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SettingsContainer } from "./SettingsContainer"

vi.mock("next-intl", () => ({
    useTranslations: (_ns: string) => (key: string) => {
        const map: Record<string, string> = {
            title: "Settings",
            description: "Manage your account settings and preferences",
            "tabs.profile": "Profile",
            "tabs.preferences": "Preferences",
            "tabs.channels": "Channels",
            "tabs.security": "Security",
            "tabs.billing": "Billing",
            "tabs.integrations": "Integrations",
        }
        return map[key] ?? key
    },
    useLocale: () => "en",
}))

vi.mock("@/lib/api/user", () => ({
    updateUserProfile: vi.fn(async () => ({
        success: true,
    })),
    downloadInvoice: vi.fn(async () => new Blob()),
    disconnectIntegration: vi.fn(async () => ({ success: true })),
    connectIntegration: vi.fn(async () => ({ success: true })),
    changePassword: vi.fn(async () => ({ success: true })),
    enableTwoFactor: vi.fn(async () => ({ success: true })),
    disableTwoFactor: vi.fn(async () => ({ success: true })),
}))

vi.mock("@/lib/logger", () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
    createLogger: () => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    }),
}))

beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn((url: string | URL | Request) => {
        const urlStr = typeof url === "string" ? url : (url as URL).toString()
        if (urlStr.includes("/api/auth/me")) {
            return Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        user: {
                            id: "1",
                            name: "Gabriel",
                            email: "gabriel@test.com",
                        },
                    }),
            })
        }
        if (urlStr.includes("/api/networks/status")) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([]),
            })
        }
        if (urlStr.includes("/api/credits/balance")) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ balance: 500 }),
            })
        }
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
        })
    }) as unknown as typeof fetch
})

describe("SettingsContainer", () => {
    it("renders the settings container with header after loading", async () => {
        render(<SettingsContainer />)

        await waitFor(() => {
            expect(screen.getByText("Settings")).toBeInTheDocument()
        })
        expect(
            screen.getByText("Manage your account settings and preferences")
        ).toBeInTheDocument()
    })

    it("renders all settings tabs", async () => {
        render(<SettingsContainer />)

        await waitFor(() => {
            expect(
                screen.getByRole("tab", { name: /profile/i })
            ).toBeInTheDocument()
        })
        expect(
            screen.getByRole("tab", { name: /preferences/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("tab", { name: /security/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("tab", { name: /billing/i })
        ).toBeInTheDocument()
        expect(
            screen.getByRole("tab", { name: /integrations/i })
        ).toBeInTheDocument()
    })

    it("shows profile tab by default", async () => {
        render(<SettingsContainer />)

        await waitFor(() => {
            const profileTab = screen.getByRole("tab", { name: /profile/i })
            expect(profileTab).toHaveAttribute("aria-selected", "true")
        })
    })

    it("switches to preferences tab when clicked", async () => {
        const user = userEvent.setup()
        render(<SettingsContainer />)

        await waitFor(() => {
            expect(
                screen.getByRole("tab", { name: /preferences/i })
            ).toBeInTheDocument()
        })

        const preferencesTab = screen.getByRole("tab", {
            name: /preferences/i,
        })
        await user.click(preferencesTab)

        expect(preferencesTab).toHaveAttribute("aria-selected", "true")
    })

    it("switches to integrations tab when clicked", async () => {
        render(<SettingsContainer />)

        await waitFor(() => {
            expect(
                screen.getByRole("tab", { name: /integrations/i })
            ).toBeInTheDocument()
        })

        const integrationsTab = screen.getByRole("tab", {
            name: /integrations/i,
        })
        integrationsTab.click()

        await waitFor(() => {
            expect(screen.getByText("Integrations")).toBeInTheDocument()
        })
    })
})
