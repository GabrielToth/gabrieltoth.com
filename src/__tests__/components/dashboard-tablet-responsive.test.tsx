import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { ChannelComparison } from "@/components/insights/ChannelComparison"
import { ChannelGraphs } from "@/components/insights/ChannelGraphs"
import { MetricsGrid } from "@/components/insights/MetricsGrid"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

/**
 * Tablet Responsive Design Tests (Task 30)
 * Tests for tablet devices (768px-1024px)
 *
 * Requirements:
 * - All components work on tablet devices
 * - Adjust layout for tablet viewports
 * - Test on various tablet screen sizes
 */

describe("Tablet Responsive Design (768px-1024px)", () => {
    describe("DashboardLayout Component", () => {
        it("should display sidebar on tablet screens", () => {
            render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            // Check for the logo which indicates sidebar is rendered
            const logos = screen.getAllByText("Dashboard")
            expect(logos.length).toBeGreaterThan(0)
        })

        it("should have proper content padding on tablet", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const mainContent = container.querySelector("main > div:last-child")
            expect(mainContent).toHaveClass("p-3", "sm:p-4", "md:p-6")
        })
    })

    describe("Sidebar Component", () => {
        it("should display desktop sidebar on tablet", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={false}
                />
            )

            // Desktop sidebar should be visible (md:flex)
            const desktopSidebar = container.querySelector(
                "aside[class*='md:flex']"
            )
            expect(desktopSidebar).toBeInTheDocument()
        })

        it("should have proper width for tablet layout", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={false}
                />
            )

            const desktopSidebar = container.querySelector(
                "aside[class*='w-60']"
            )
            expect(desktopSidebar).toHaveClass("w-60")
        })

        it("should display all navigation items on tablet", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={false}
                />
            )

            // Check for at least one navigation item
            const publishBtns = screen.getAllByText("Publish")
            expect(publishBtns.length).toBeGreaterThan(0)
        })
    })

    describe("MetricsGrid Component", () => {
        const mockMetrics = [
            {
                id: "followers",
                name: "Followers",
                value: 12500,
                change: 250,
                changePercent: 2.04,
                icon: "users",
            },
            {
                id: "engagement",
                name: "Engagement",
                value: 3450,
                change: 120,
                changePercent: 3.6,
                icon: "heart",
            },
            {
                id: "reach",
                name: "Reach",
                value: 45000,
                change: -500,
                changePercent: -1.1,
                icon: "trending-up",
            },
            {
                id: "impressions",
                name: "Impressions",
                value: 125000,
                change: 5000,
                changePercent: 4.17,
                icon: "eye",
            },
        ]

        it("should display 2 columns on tablet", () => {
            const { container } = render(<MetricsGrid metrics={mockMetrics} />)

            const grid = container.querySelector("div[class*='grid']")
            expect(grid).toHaveClass("sm:grid-cols-2")
        })

        it("should display all metrics on tablet", () => {
            render(<MetricsGrid metrics={mockMetrics} />)

            expect(screen.getByText("Followers")).toBeInTheDocument()
            expect(screen.getByText("Engagement")).toBeInTheDocument()
            expect(screen.getByText("Reach")).toBeInTheDocument()
            expect(screen.getByText("Impressions")).toBeInTheDocument()
        })
    })

    describe("ChannelGraphs Component", () => {
        const mockChannels = [
            {
                id: "facebook",
                platform: "facebook" as const,
                accountId: "123",
                accountName: "My Facebook",
                isConnected: true,
            },
            {
                id: "instagram",
                platform: "instagram" as const,
                accountId: "456",
                accountName: "My Instagram",
                isConnected: true,
            },
        ]

        const mockGraphData = [
            {
                date: "2024-01-01",
                followers: 10000,
                engagement: 500,
                reach: 40000,
                impressions: 100000,
                channel: "facebook",
            },
            {
                date: "2024-01-02",
                followers: 10100,
                engagement: 520,
                reach: 41000,
                impressions: 102000,
                channel: "facebook",
            },
        ]

        it("should display graphs with responsive table layout", () => {
            const { container } = render(
                <ChannelGraphs channels={mockChannels} data={mockGraphData} />
            )

            const tables = container.querySelectorAll("table")
            expect(tables.length).toBeGreaterThan(0)
        })

        it("should display stats grid with responsive columns", () => {
            const { container } = render(
                <ChannelGraphs channels={mockChannels} data={mockGraphData} />
            )

            const statsGrid = container.querySelector("div[class*='grid']")
            expect(statsGrid).toHaveClass("sm:grid-cols-4")
        })
    })

    describe("ChannelComparison Component", () => {
        const mockChannels = [
            {
                id: "facebook",
                platform: "facebook" as const,
                accountId: "123",
                accountName: "My Facebook",
                isConnected: true,
            },
            {
                id: "instagram",
                platform: "instagram" as const,
                accountId: "456",
                accountName: "My Instagram",
                isConnected: true,
            },
        ]

        const mockMetrics = [
            {
                id: "followers",
                name: "Followers",
                value: 12500,
                change: 250,
                changePercent: 2.04,
                icon: "users",
            },
        ]

        it("should display channel selection grid on tablet", () => {
            const { container } = render(
                <ChannelComparison
                    channels={mockChannels}
                    selectedChannels={[]}
                    metrics={mockMetrics}
                    onChannelSelectionChange={() => {}}
                />
            )

            const grid = container.querySelector("div[class*='grid']")
            expect(grid).toHaveClass("sm:grid-cols-2")
        })

        it("should display comparison table with proper layout", () => {
            const { container } = render(
                <ChannelComparison
                    channels={mockChannels}
                    selectedChannels={["facebook", "instagram"]}
                    metrics={mockMetrics}
                    onChannelSelectionChange={() => {}}
                />
            )

            const table = container.querySelector("table")
            expect(table).toBeInTheDocument()
        })
    })

    describe("Tablet Layout Adjustments", () => {
        it("should have proper spacing for tablet layout", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const mainContent = container.querySelector("main > div:last-child")
            // Should have responsive padding: p-3 sm:p-4 md:p-6
            expect(mainContent).toHaveClass("p-3", "sm:p-4", "md:p-6")
        })

        it("should display sidebar and content side-by-side on tablet", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const layout = container.querySelector("div[class*='flex']")
            expect(layout).toHaveClass("flex")
        })
    })

    describe("Tablet-Specific Features", () => {
        it("should hide mobile hamburger menu on tablet", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const mobileHeader = container.querySelector(
                "div[class*='md:hidden']"
            )
            expect(mobileHeader).toBeInTheDocument()
        })

        it("should display full navigation on tablet", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={false}
                />
            )

            const publishBtns = screen.getAllByText("Publish")
            expect(publishBtns.length).toBeGreaterThan(0)
        })

        it("should display organization info on tablet", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={false}
                    organization={{
                        name: "Test Org",
                        plan: "pro",
                    }}
                />
            )

            const orgNames = screen.getAllByText("Test Org")
            expect(orgNames.length).toBeGreaterThan(0)
        })
    })

    describe("Responsive Grid Layouts", () => {
        it("should use 2-column layout for metrics on tablet", () => {
            const mockMetrics = [
                {
                    id: "1",
                    name: "Metric 1",
                    value: 100,
                    change: 10,
                    changePercent: 10,
                    icon: "users",
                },
                {
                    id: "2",
                    name: "Metric 2",
                    value: 200,
                    change: 20,
                    changePercent: 10,
                    icon: "heart",
                },
                {
                    id: "3",
                    name: "Metric 3",
                    value: 300,
                    change: 30,
                    changePercent: 10,
                    icon: "trending-up",
                },
                {
                    id: "4",
                    name: "Metric 4",
                    value: 400,
                    change: 40,
                    changePercent: 10,
                    icon: "eye",
                },
            ]

            const { container } = render(<MetricsGrid metrics={mockMetrics} />)

            const grid = container.querySelector("div[class*='grid']")
            expect(grid).toHaveClass("sm:grid-cols-2")
        })

        it("should use 4-column layout for metrics on desktop", () => {
            const mockMetrics = [
                {
                    id: "1",
                    name: "Metric 1",
                    value: 100,
                    change: 10,
                    changePercent: 10,
                    icon: "users",
                },
                {
                    id: "2",
                    name: "Metric 2",
                    value: 200,
                    change: 20,
                    changePercent: 10,
                    icon: "heart",
                },
                {
                    id: "3",
                    name: "Metric 3",
                    value: 300,
                    change: 30,
                    changePercent: 10,
                    icon: "trending-up",
                },
                {
                    id: "4",
                    name: "Metric 4",
                    value: 400,
                    change: 40,
                    changePercent: 10,
                    icon: "eye",
                },
            ]

            const { container } = render(<MetricsGrid metrics={mockMetrics} />)

            const grid = container.querySelector("div[class*='grid']")
            expect(grid).toHaveClass("lg:grid-cols-4")
        })
    })
})
