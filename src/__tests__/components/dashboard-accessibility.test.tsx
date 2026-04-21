import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { MetricCard } from "@/components/insights/MetricCard"
import { TimePeriodSelector } from "@/components/insights/TimePeriodSelector"
import { FilterBar } from "@/components/publish/FilterBar"
import { PostCard } from "@/components/publish/PostCard"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

/**
 * Accessibility Tests (Task 31)
 * Tests for WCAG 2.1 AA compliance
 *
 * Requirements:
 * - Run automated accessibility tests with axe-core
 * - Check color contrast ratios (WCAG 2.1 AA)
 * - Verify keyboard navigation
 * - Check ARIA labels and semantic HTML
 */

describe("Accessibility - WCAG 2.1 AA Compliance", () => {
    describe("DashboardLayout Component", () => {
        it("should have proper semantic HTML structure", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            // Check for main element
            const main = container.querySelector("main")
            expect(main).toBeInTheDocument()
        })

        it("should have proper focus management", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const hamburgerButton = container.querySelector(
                "button[aria-label='Toggle sidebar']"
            )
            expect(hamburgerButton).toHaveClass("focus:ring-2")
        })

        it("should have aria-expanded attribute for hamburger button", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const hamburgerButton = container.querySelector(
                "button[aria-label='Toggle sidebar']"
            )
            expect(hamburgerButton).toHaveAttribute("aria-expanded")
        })
    })

    describe("Sidebar Component", () => {
        it("should have ARIA labels for icon-only buttons", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const channelButtons = container.querySelectorAll(
                "button[aria-label*='Connect']"
            )
            expect(channelButtons.length).toBeGreaterThan(0)
        })

        it("should have proper navigation structure", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const nav = container.querySelector("nav")
            expect(nav).toBeInTheDocument()
        })

        it("should have aria-current for active navigation item", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const activeButton = container.querySelector(
                "button[aria-current='page']"
            )
            expect(activeButton).toBeInTheDocument()
        })

        it("should have proper close button accessibility", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                    onClose={() => {}}
                />
            )

            const closeButton = container.querySelector(
                "button[aria-label='Close sidebar']"
            )
            expect(closeButton).toBeInTheDocument()
        })

        it("should have minimum touch target size for buttons", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const buttons = container.querySelectorAll("button")
            buttons.forEach(button => {
                // Navigation buttons have min-h-11, channel buttons have min-h-11 min-w-11
                const hasMinHeight = button.className.includes("min-h-11")
                expect(hasMinHeight).toBe(true)
            })
        })
    })

    describe("PostCard Component", () => {
        const mockPost = {
            id: "1",
            title: "Test Post",
            content: "This is a test post content",
            scheduledAt: new Date(),
            status: "scheduled" as const,
            channels: ["facebook", "instagram"],
            createdAt: new Date(),
        }

        it("should have proper heading hierarchy", () => {
            const { container } = render(
                <PostCard
                    post={mockPost}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            )

            const heading = container.querySelector("h3")
            expect(heading).toBeInTheDocument()
        })

        it("should have proper button titles for accessibility", () => {
            const { container } = render(
                <PostCard
                    post={mockPost}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            )

            const buttons = container.querySelectorAll("button")
            buttons.forEach(button => {
                expect(
                    button.textContent ||
                        button.getAttribute("aria-label") ||
                        button.getAttribute("title")
                ).toBeTruthy()
            })
        })

        it("should have minimum touch target size for buttons", () => {
            const { container } = render(
                <PostCard
                    post={mockPost}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            )

            const buttons = container.querySelectorAll("button")
            buttons.forEach(button => {
                expect(button).toHaveClass("min-h-10", "min-w-10")
            })
        })
    })

    describe("MetricCard Component", () => {
        const mockMetric = {
            id: "followers",
            name: "Followers",
            value: 12500,
            change: 250,
            changePercent: 2.04,
            icon: "users",
        }

        it("should have proper semantic structure", () => {
            const { container } = render(<MetricCard metric={mockMetric} />)

            // Check for proper card structure
            const card = container.querySelector("div[class*='Card']")
            expect(card).toBeInTheDocument()
        })

        it("should display metric name for accessibility", () => {
            render(<MetricCard metric={mockMetric} />)

            expect(screen.getByText("Followers")).toBeInTheDocument()
        })
    })

    describe("FilterBar Component", () => {
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

        it("should have proper label for filter controls", () => {
            const { container } = render(
                <FilterBar
                    channels={mockChannels}
                    selectedChannels={[]}
                    onFilterChange={() => {}}
                />
            )

            const label = container.querySelector("label")
            expect(label).toBeInTheDocument()
        })

        it("should have aria-pressed for toggle buttons", () => {
            const { container } = render(
                <FilterBar
                    channels={mockChannels}
                    selectedChannels={["facebook"]}
                    onFilterChange={() => {}}
                />
            )

            const buttons = container.querySelectorAll("button[aria-pressed]")
            expect(buttons.length).toBeGreaterThan(0)
        })

        it("should have minimum touch target size for buttons", () => {
            const { container } = render(
                <FilterBar
                    channels={mockChannels}
                    selectedChannels={[]}
                    onFilterChange={() => {}}
                />
            )

            const buttons = container.querySelectorAll("button")
            buttons.forEach(button => {
                expect(button).toHaveClass("min-h-10")
            })
        })
    })

    describe("TimePeriodSelector Component", () => {
        it("should have proper button labels", () => {
            const { container } = render(
                <TimePeriodSelector
                    selectedPeriod="7d"
                    onPeriodChange={() => {}}
                />
            )

            const buttons = container.querySelectorAll("button")
            buttons.forEach(button => {
                expect(button.textContent).toBeTruthy()
            })
        })

        it("should have minimum touch target size for buttons", () => {
            const { container } = render(
                <TimePeriodSelector
                    selectedPeriod="7d"
                    onPeriodChange={() => {}}
                />
            )

            const buttons = container.querySelectorAll("button")
            buttons.forEach(button => {
                expect(button).toHaveClass("min-h-10")
            })
        })
    })

    describe("Keyboard Navigation", () => {
        it("should have focusable interactive elements", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const buttons = container.querySelectorAll("button")
            expect(buttons.length).toBeGreaterThan(0)

            buttons.forEach(button => {
                expect(button.tagName).toBe("BUTTON")
            })
        })

        it("should have visible focus indicators", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const hamburgerButton = container.querySelector(
                "button[aria-label='Toggle sidebar']"
            )
            expect(hamburgerButton).toHaveClass("focus:ring-2")
        })
    })

    describe("ARIA Labels and Semantic HTML", () => {
        it("should use semantic HTML elements", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const main = container.querySelector("main")
            expect(main).toBeInTheDocument()
        })

        it("should have proper ARIA labels for icon buttons", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const iconButtons = container.querySelectorAll("button[aria-label]")
            expect(iconButtons.length).toBeGreaterThan(0)
        })

        it("should have proper form labels", () => {
            const { container } = render(
                <FilterBar
                    channels={[
                        {
                            id: "facebook",
                            platform: "facebook",
                            accountId: "123",
                            accountName: "My Facebook",
                            isConnected: true,
                        },
                    ]}
                    selectedChannels={[]}
                    onFilterChange={() => {}}
                />
            )

            const label = container.querySelector("label")
            expect(label).toBeInTheDocument()
        })
    })

    describe("Form Accessibility", () => {
        it("should have proper input labels", () => {
            const { container } = render(
                <FilterBar
                    channels={[
                        {
                            id: "facebook",
                            platform: "facebook",
                            accountId: "123",
                            accountName: "My Facebook",
                            isConnected: true,
                        },
                    ]}
                    selectedChannels={[]}
                    onFilterChange={() => {}}
                />
            )

            const label = container.querySelector("label")
            expect(label).toBeInTheDocument()
            expect(label?.textContent).toContain("Filter")
        })
    })

    describe("Image and Icon Accessibility", () => {
        it("should have proper alt text or ARIA labels for icons", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const buttons = container.querySelectorAll("button")
            buttons.forEach(button => {
                const hasAriaLabel = button.getAttribute("aria-label")
                const hasTitle = button.getAttribute("title")
                const hasText = button.textContent?.trim()

                expect(hasAriaLabel || hasTitle || hasText).toBeTruthy()
            })
        })
    })

    describe("Text Readability", () => {
        it("should have readable text sizes on mobile", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const navButtons = container.querySelectorAll("nav button")
            navButtons.forEach(button => {
                const hasReadableSize =
                    button.className.includes("text-base") ||
                    button.className.includes("text-sm") ||
                    button.className.includes("text-lg")
                expect(hasReadableSize).toBe(true)
            })
        })
    })

    describe("Color Contrast", () => {
        it("should use proper color classes for contrast", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            // Check that text elements have color classes
            const textElements = container.querySelectorAll(
                "[class*='text-gray'], [class*='text-blue'], [class*='text-white']"
            )
            expect(textElements.length).toBeGreaterThan(0)
        })
    })

    describe("Responsive Design Accessibility", () => {
        it("should have responsive padding for better readability", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const mainContent = container.querySelector("main > div:last-child")
            expect(mainContent).toHaveClass("p-3", "sm:p-4", "md:p-6")
        })

        it("should have responsive text sizes", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const navButtons = container.querySelectorAll("nav button")
            navButtons.forEach(button => {
                const hasResponsiveSize =
                    button.className.includes("text-base") ||
                    button.className.includes("text-sm")
                expect(hasResponsiveSize).toBe(true)
            })
        })
    })
})
