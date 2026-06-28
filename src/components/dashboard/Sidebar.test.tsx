import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Sidebar } from "./Sidebar"

vi.mock("@/components/theme/theme-toggle-client", () => ({
    ThemeToggleClient: () => null,
}))

vi.mock("next-intl", () => ({
    useTranslations:
        (ns: string) =>
        (key: string, params?: Record<string, string | number>) => {
            const map: Record<string, string> = {
                "dashboard.layout.dashboard": "Dashboard",
                "dashboard.layout.closeSidebar": "Close sidebar",
                "dashboard.layout.organization": "Organization",
                "dashboard.layout.myOrganization": "My Organization",
                "dashboard.layout.connected": "Connected",
                "dashboard.layout.disconnected": "Disconnected",
                "dashboard.layout.connectChannel": "Connect {channel}",
                "dashboard.layout.channelsConnected":
                    "{count} of {total} channels connected",
                "dashboard.layout.plan.free": "Free",
                "dashboard.layout.plan.pro": "Pro",
                "dashboard.layout.plan.enterprise": "Enterprise",
                "dashboard.sidebar.publish": "Publish",
                "dashboard.sidebar.insights": "Insights",
                "dashboard.sidebar.settings": "Settings",
                "dashboard.sidebar.logout": "Logout",
                "dashboard.sidebar.connectChannels": "Connect Channels",
            }
            let value = map[`${ns}.${key}`] ?? key
            if (params) {
                for (const [k, v] of Object.entries(params)) {
                    value = value.replace(`{${k}}`, String(v))
                }
            }
            return value
        },
    useLocale: () => "en",
}))

describe("Sidebar", () => {
    it("renders sidebar with logo", () => {
        render(<Sidebar activeTab="publish" onTabChange={vi.fn()} />)
        const dashboardTexts = screen.getAllByText("Dashboard")
        expect(dashboardTexts.length).toBeGreaterThan(0)
    })

    it("renders all navigation items", () => {
        render(<Sidebar activeTab="publish" onTabChange={vi.fn()} />)
        const publishButtons = screen.getAllByRole("button", {
            name: /publish/i,
        })
        const insightsButtons = screen.getAllByRole("button", {
            name: /insights/i,
        })
        const settingsButtons = screen.getAllByRole("button", {
            name: /settings/i,
        })
        expect(publishButtons.length).toBeGreaterThan(0)
        expect(insightsButtons.length).toBeGreaterThan(0)
        expect(settingsButtons.length).toBeGreaterThan(0)
    })

    it("highlights active tab", () => {
        render(<Sidebar activeTab="insights" onTabChange={vi.fn()} />)
        const insightsButtons = screen.getAllByRole("button", {
            name: /insights/i,
        })
        const activeButton = insightsButtons.find(btn =>
            btn.hasAttribute("aria-current")
        )
        expect(activeButton).toHaveAttribute("aria-current", "page")
    })

    it("calls onTabChange when navigation item is clicked", () => {
        const onTabChange = vi.fn()
        render(<Sidebar activeTab="publish" onTabChange={onTabChange} />)
        const settingsButtons = screen.getAllByRole("button", {
            name: /settings/i,
        })
        fireEvent.click(settingsButtons[0])
        expect(onTabChange).toHaveBeenCalledWith("settings")
    })

    it("renders organization info", () => {
        render(
            <Sidebar
                activeTab="publish"
                onTabChange={vi.fn()}
                organization={{ name: "Test Org", plan: "pro" }}
            />
        )
        const orgTexts = screen.getAllByText("Test Org")
        expect(orgTexts.length).toBeGreaterThan(0)
    })

    it("renders logout button", () => {
        render(<Sidebar activeTab="publish" onTabChange={vi.fn()} />)
        const logoutButtons = screen.getAllByRole("button", { name: /logout/i })
        expect(logoutButtons.length).toBeGreaterThan(0)
    })

    it("calls onLogout when logout button is clicked", () => {
        const onLogout = vi.fn()
        render(
            <Sidebar
                activeTab="publish"
                onTabChange={vi.fn()}
                onLogout={onLogout}
            />
        )
        const logoutButtons = screen.getAllByRole("button", { name: /logout/i })
        fireEvent.click(logoutButtons[0])
        expect(onLogout).toHaveBeenCalled()
    })

    it("renders connect channels section", () => {
        render(<Sidebar activeTab="publish" onTabChange={vi.fn()} />)
        const channelTexts = screen.getAllByText(/connect channels/i)
        expect(channelTexts.length).toBeGreaterThan(0)
    })

    it("renders all social channel buttons", () => {
        render(<Sidebar activeTab="publish" onTabChange={vi.fn()} />)
        const youtubeButtons = screen.getAllByLabelText(/connect youtube/i)
        const facebookButtons = screen.getAllByLabelText(/connect facebook/i)
        const instagramButtons = screen.getAllByLabelText(/connect instagram/i)
        const twitterButtons = screen.getAllByLabelText(/connect twitter/i)
        const tiktokButtons = screen.getAllByLabelText(/connect tiktok/i)
        const linkedinButtons = screen.getAllByLabelText(/connect linkedin/i)
        expect(youtubeButtons.length).toBeGreaterThan(0)
        expect(facebookButtons.length).toBeGreaterThan(0)
        expect(instagramButtons.length).toBeGreaterThan(0)
        expect(twitterButtons.length).toBeGreaterThan(0)
        expect(tiktokButtons.length).toBeGreaterThan(0)
        expect(linkedinButtons.length).toBeGreaterThan(0)
    })

    it("closes mobile sidebar when close button is clicked", () => {
        const onClose = vi.fn()
        render(
            <Sidebar
                activeTab="publish"
                onTabChange={vi.fn()}
                isOpen={true}
                onClose={onClose}
            />
        )
        const closeButton = screen.getByLabelText("Close sidebar")
        fireEvent.click(closeButton)
        expect(onClose).toHaveBeenCalled()
    })

    it("renders mobile sidebar when isOpen is true", () => {
        const { container } = render(
            <Sidebar activeTab="publish" onTabChange={vi.fn()} isOpen={true} />
        )
        const sidebars = container.querySelectorAll("aside")
        const mobileSidebar = sidebars[1]
        expect(mobileSidebar).toHaveClass("translate-x-0")
    })

    it("hides mobile sidebar when isOpen is false", () => {
        const { container } = render(
            <Sidebar activeTab="publish" onTabChange={vi.fn()} isOpen={false} />
        )
        const sidebars = container.querySelectorAll("aside")
        const mobileSidebar = sidebars[1]
        expect(mobileSidebar).toHaveClass("-translate-x-full")
    })

    it("uses default organization when not provided", () => {
        render(<Sidebar activeTab="publish" onTabChange={vi.fn()} />)
        const orgTexts = screen.getAllByText("My Organization")
        expect(orgTexts.length).toBeGreaterThan(0)
    })

    it("displays correct plan badge", () => {
        render(
            <Sidebar
                activeTab="publish"
                onTabChange={vi.fn()}
                organization={{ name: "Test Org", plan: "enterprise" }}
            />
        )
        const planTexts = screen.getAllByText(/enterprise/i)
        expect(planTexts.length).toBeGreaterThan(0)
    })
})
