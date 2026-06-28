/**
 * Preservation Property Tests - Logout Button Not Working
 *
 * This test suite captures existing behavior on UNFIXED code for non-logout interactions.
 * These tests verify that the fix does not break any existing functionality.
 *
 * EXPECTED BEHAVIOR ON UNFIXED CODE: All tests PASS
 * - Navigation between tabs works correctly
 * - Sidebar toggle on mobile opens/closes sidebar
 * - Organization info displays with correct name and plan
 * - All sidebar elements render without errors
 * - Channel connection buttons are clickable
 * - GoogleLogoutButton component works independently
 *
 * EXPECTED BEHAVIOR ON FIXED CODE: All tests PASS (no regressions)
 * - All non-logout interactions continue to work exactly as before
 * - Only logout button behavior changes
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/theme/theme-toggle-client", () => ({
    ThemeToggleClient: () => null,
}))

vi.mock("next-intl", () => ({
    useTranslations:
        (ns: string) => (key: string, params?: Record<string, string>) => {
            const map: Record<string, string> = {
                "dashboard.sidebar.publish": "Publish",
                "dashboard.sidebar.insights": "Insights",
                "dashboard.sidebar.settings": "Settings",
                "dashboard.sidebar.logout": "Logout",
                "dashboard.sidebar.connectChannels": "Connect Channels",
                "dashboard.sidebar.plan.free": "Free",
                "dashboard.sidebar.plan.pro": "Pro",
                "dashboard.sidebar.plan.enterprise": "Enterprise",
                "dashboard.layout.dashboard": "Dashboard",
                "dashboard.layout.toggleSidebar": "Toggle sidebar",
                "dashboard.layout.closeSidebar": "Close sidebar",
                "dashboard.layout.organization": "Organization",
                "dashboard.layout.myOrganization": "My Organization",
                "dashboard.layout.connectChannel": "Connect {channel}",
                "dashboard.layout.connected": "Connected",
                "dashboard.layout.channelsConnected":
                    "{count} of {total} channels connected",
            }
            let value = map[`${ns}.${key}`] ?? key
            if (params) {
                for (const [k, v] of Object.entries(params)) {
                    value = value.replace(`{${k}}`, v)
                }
            }
            return value
        },
    useLocale: () => "en",
}))

describe("Preservation Property Tests - Non-Logout Dashboard Interactions", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("Property 2.1: Navigation Between Tabs Changes Active Tab Correctly", () => {
        it("should render all navigation tabs", () => {
            render(
                <DashboardLayout activeTab="publish">
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            expect(
                screen.getAllByRole("button", { name: /publish/i }).length
            ).toBeGreaterThan(0)
            expect(
                screen.getAllByRole("button", { name: /insights/i }).length
            ).toBeGreaterThan(0)
            expect(
                screen.getAllByRole("button", { name: /settings/i }).length
            ).toBeGreaterThan(0)
        })

        it("should highlight active tab (Publish)", () => {
            render(
                <DashboardLayout activeTab="publish">
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            const publishButtons = screen.getAllByRole("button", {
                name: /publish/i,
            })
            expect(publishButtons[0]).toHaveClass("bg-blue-50")
            expect(publishButtons[0]).toHaveClass("text-blue-600")
        })

        it("should highlight active tab (Insights)", () => {
            render(
                <DashboardLayout activeTab="insights">
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            const insightsButtons = screen.getAllByRole("button", {
                name: /insights/i,
            })
            expect(insightsButtons[0]).toHaveClass("bg-blue-50")
            expect(insightsButtons[0]).toHaveClass("text-blue-600")
        })

        it("should highlight active tab (Settings)", () => {
            render(
                <DashboardLayout activeTab="settings">
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            const settingsButtons = screen.getAllByRole("button", {
                name: /settings/i,
            })
            expect(settingsButtons[0]).toHaveClass("bg-blue-50")
            expect(settingsButtons[0]).toHaveClass("text-blue-600")
        })

        it("should call onTabChange when navigation button is clicked", () => {
            const onTabChange = vi.fn()

            render(
                <DashboardLayout activeTab="publish" onTabChange={onTabChange}>
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            const insightsButtons = screen.getAllByRole("button", {
                name: /insights/i,
            })
            fireEvent.click(insightsButtons[0])

            expect(onTabChange).toHaveBeenCalledWith("insights")
        })

        it("should handle multiple tab changes in sequence", () => {
            const onTabChange = vi.fn()

            render(
                <DashboardLayout activeTab="publish" onTabChange={onTabChange}>
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            const insightsButtons = screen.getAllByRole("button", {
                name: /insights/i,
            })
            const settingsButtons = screen.getAllByRole("button", {
                name: /settings/i,
            })

            fireEvent.click(insightsButtons[0])
            fireEvent.click(settingsButtons[0])

            expect(onTabChange).toHaveBeenCalledTimes(2)
            expect(onTabChange).toHaveBeenNthCalledWith(1, "insights")
            expect(onTabChange).toHaveBeenNthCalledWith(2, "settings")
        })
    })

    describe("Property 2.2: Sidebar Toggle on Mobile Opens/Closes Sidebar", () => {
        it("should render hamburger menu button on mobile", () => {
            render(
                <DashboardLayout activeTab="publish">
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            const hamburgerButton = screen.getByRole("button", {
                name: /toggle sidebar/i,
            })
            expect(hamburgerButton).toBeInTheDocument()
        })

        it("should toggle sidebar visibility when hamburger is clicked", async () => {
            render(
                <DashboardLayout activeTab="publish">
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            const hamburgerButton = screen.getByRole("button", {
                name: /toggle sidebar/i,
            })

            // Initially sidebar should be closed (aria-expanded=false)
            expect(hamburgerButton).toHaveAttribute("aria-expanded", "false")

            // Click to open
            fireEvent.click(hamburgerButton)

            await waitFor(() => {
                expect(hamburgerButton).toHaveAttribute("aria-expanded", "true")
            })

            // Click to close
            fireEvent.click(hamburgerButton)

            await waitFor(() => {
                expect(hamburgerButton).toHaveAttribute(
                    "aria-expanded",
                    "false"
                )
            })
        })

        it("should close sidebar when close button is clicked", async () => {
            render(
                <DashboardLayout activeTab="publish">
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            const hamburgerButton = screen.getByRole("button", {
                name: /toggle sidebar/i,
            })

            // Open sidebar
            fireEvent.click(hamburgerButton)

            await waitFor(() => {
                expect(hamburgerButton).toHaveAttribute("aria-expanded", "true")
            })

            // Find and click the close button in mobile sidebar
            const closeButton = screen.getByRole("button", {
                name: /close sidebar/i,
            })
            fireEvent.click(closeButton)

            await waitFor(() => {
                expect(hamburgerButton).toHaveAttribute(
                    "aria-expanded",
                    "false"
                )
            })
        })

        it("should close sidebar when navigation button is clicked", async () => {
            render(
                <DashboardLayout activeTab="publish">
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            const hamburgerButton = screen.getByRole("button", {
                name: /toggle sidebar/i,
            })

            // Open sidebar
            fireEvent.click(hamburgerButton)

            await waitFor(() => {
                expect(hamburgerButton).toHaveAttribute("aria-expanded", "true")
            })

            // Click a navigation button
            const insightsButtons = screen.getAllByRole("button", {
                name: /insights/i,
            })
            fireEvent.click(insightsButtons[0])

            await waitFor(() => {
                expect(hamburgerButton).toHaveAttribute(
                    "aria-expanded",
                    "false"
                )
            })
        })
    })

    describe("Property 2.3: Organization Info Displays with Correct Name and Plan", () => {
        it("should display organization name", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    organization={{
                        name: "Acme Corporation",
                        plan: "pro",
                    }}
                />
            )

            expect(
                screen.getAllByText("Acme Corporation").length
            ).toBeGreaterThan(0)
        })

        it("should display organization plan", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    organization={{
                        name: "Acme Corporation",
                        plan: "pro",
                    }}
                />
            )

            expect(screen.getAllByText("Pro").length).toBeGreaterThan(0)
        })

        it("should display default organization when not provided", () => {
            render(<Sidebar activeTab="publish" onTabChange={() => {}} />)

            expect(
                screen.getAllByText("My Organization").length
            ).toBeGreaterThan(0)
            expect(screen.getAllByText("Pro").length).toBeGreaterThan(0)
        })

        it("should display free plan correctly", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    organization={{
                        name: "Startup Inc",
                        plan: "free",
                    }}
                />
            )

            expect(screen.getAllByText("Startup Inc").length).toBeGreaterThan(0)
            expect(screen.getAllByText("Free").length).toBeGreaterThan(0)
        })

        it("should display enterprise plan correctly", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    organization={{
                        name: "Enterprise Co",
                        plan: "enterprise",
                    }}
                />
            )

            expect(screen.getAllByText("Enterprise Co").length).toBeGreaterThan(
                0
            )
            expect(screen.getAllByText("Enterprise").length).toBeGreaterThan(0)
        })

        it("should update organization info when props change", () => {
            const { rerender } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    organization={{
                        name: "Old Company",
                        plan: "free",
                    }}
                />
            )

            expect(screen.getAllByText("Old Company").length).toBeGreaterThan(0)

            rerender(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    organization={{
                        name: "New Company",
                        plan: "enterprise",
                    }}
                />
            )

            expect(screen.getAllByText("New Company").length).toBeGreaterThan(0)
            expect(screen.getAllByText("Enterprise").length).toBeGreaterThan(0)
        })
    })

    describe("Property 2.4: All Sidebar Elements Render Without Errors", () => {
        it("should render sidebar without errors", () => {
            expect(() => {
                render(<Sidebar activeTab="publish" onTabChange={() => {}} />)
            }).not.toThrow()
        })

        it("should render dashboard layout without errors", () => {
            expect(() => {
                render(
                    <DashboardLayout activeTab="publish">
                        <div>Dashboard Content</div>
                    </DashboardLayout>
                )
            }).not.toThrow()
        })

        it("should render all navigation items without errors", () => {
            render(<Sidebar activeTab="publish" onTabChange={() => {}} />)

            const navButtons = screen.getAllByRole("button", {
                name: /publish|insights|settings/i,
            })
            expect(navButtons.length).toBeGreaterThanOrEqual(3)
        })

        it("should render all channel buttons without errors", () => {
            render(<Sidebar activeTab="publish" onTabChange={() => {}} />)

            // Channel buttons should be present
            const channelButtons = screen.getAllByRole("button", {
                name: /connect/i,
            })
            expect(channelButtons.length).toBeGreaterThan(0)
        })

        it("should render organization section without errors", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    organization={{
                        name: "Test Org",
                        plan: "pro",
                    }}
                />
            )

            expect(screen.getAllByText("Test Org").length).toBeGreaterThan(0)
            expect(screen.getAllByText("Pro").length).toBeGreaterThan(0)
        })

        it("should render logo section without errors", () => {
            render(<Sidebar activeTab="publish" onTabChange={() => {}} />)

            expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0)
        })
    })

    describe("Property 2.5: Channel Connection Buttons Are Clickable", () => {
        it("should render channel buttons", () => {
            render(<Sidebar activeTab="publish" onTabChange={() => {}} />)

            const channelButtons = screen.getAllByRole("button", {
                name: /connect/i,
            })
            expect(channelButtons.length).toBeGreaterThan(0)
        })

        it("should allow clicking channel buttons", () => {
            render(<Sidebar activeTab="publish" onTabChange={() => {}} />)

            const channelButtons = screen.getAllByRole("button", {
                name: /connect/i,
            })

            expect(() => {
                fireEvent.click(channelButtons[0])
            }).not.toThrow()
        })

        it("should have correct aria labels for channel buttons", () => {
            render(<Sidebar activeTab="publish" onTabChange={() => {}} />)

            expect(
                screen.getAllByLabelText(/connect facebook/i).length
            ).toBeGreaterThan(0)
            expect(
                screen.getAllByLabelText(/connect instagram/i).length
            ).toBeGreaterThan(0)
            expect(
                screen.getAllByLabelText(/connect twitter/i).length
            ).toBeGreaterThan(0)
        })

        it("should render all expected channels", () => {
            render(<Sidebar activeTab="publish" onTabChange={() => {}} />)

            expect(
                screen.getAllByLabelText(/connect facebook/i).length
            ).toBeGreaterThan(0)
            expect(
                screen.getAllByLabelText(/connect instagram/i).length
            ).toBeGreaterThan(0)
            expect(
                screen.getAllByLabelText(/connect twitter/i).length
            ).toBeGreaterThan(0)
            expect(
                screen.getAllByLabelText(/connect tiktok/i).length
            ).toBeGreaterThan(0)
            expect(
                screen.getAllByLabelText(/connect linkedin/i).length
            ).toBeGreaterThan(0)
        })
    })

    describe("Property 2.6: GoogleLogoutButton Component Works Independently", () => {
        it("should render logout button in sidebar", () => {
            render(<Sidebar activeTab="publish" onTabChange={() => {}} />)

            const logoutButtons = screen.getAllByRole("button", {
                name: /logout/i,
            })
            expect(logoutButtons.length).toBeGreaterThan(0)
        })

        it("should allow clicking logout button", () => {
            render(<Sidebar activeTab="publish" onTabChange={() => {}} />)

            const logoutButtons = screen.getAllByRole("button", {
                name: /logout/i,
            })

            expect(() => {
                fireEvent.click(logoutButtons[0])
            }).not.toThrow()
        })

        it("should call onLogout callback when logout button is clicked", () => {
            const onLogout = vi.fn()

            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    onLogout={onLogout}
                />
            )

            const logoutButtons = screen.getAllByRole("button", {
                name: /logout/i,
            })
            fireEvent.click(logoutButtons[0])

            expect(onLogout).toHaveBeenCalled()
        })

        it("should render logout button in both desktop and mobile sidebars", () => {
            render(
                <DashboardLayout activeTab="publish">
                    <div>Dashboard Content</div>
                </DashboardLayout>
            )

            const logoutButtons = screen.getAllByRole("button", {
                name: /logout/i,
            })
            // Should have at least 2 logout buttons (desktop and mobile)
            expect(logoutButtons.length).toBeGreaterThanOrEqual(2)
        })
    })
})
