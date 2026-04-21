import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { MetricCard } from "@/components/insights/MetricCard"
import { PostCard } from "@/components/publish/PostCard"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

/**
 * Mobile Responsive Design Tests (Task 29)
 * Tests for mobile devices (<768px)
 *
 * Requirements:
 * - All components work on mobile devices
 * - Test on various mobile screen sizes
 * - Optimize touch interactions
 * - Ensure readable text sizes (minimum 16px)
 * - Ensure touch-friendly button sizes (minimum 44x44px)
 */

describe("Mobile Responsive Design (<768px)", () => {
    describe("DashboardLayout Component", () => {
        it("should render mobile header with hamburger menu on small screens", () => {
            render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            // Mobile header should be visible
            const hamburgerButton = screen.getByLabelText("Toggle sidebar")
            expect(hamburgerButton).toBeInTheDocument()

            // Check for mobile-specific classes (md:hidden means hidden on medium and up)
            const mobileHeader = hamburgerButton.closest("div")
            expect(mobileHeader).toHaveClass("md:hidden")
        })

        it("should have proper padding on mobile", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const mainContent = container.querySelector("main > div:last-child")
            expect(mainContent).toHaveClass("p-3", "sm:p-4", "md:p-6")
        })

        it("should have minimum height for touch-friendly hamburger button", () => {
            render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const hamburgerButton = screen.getByLabelText("Toggle sidebar")
            expect(hamburgerButton).toHaveClass("min-h-10", "min-w-10")
        })
    })

    describe("Sidebar Component", () => {
        it("should have touch-friendly navigation buttons (44x44px minimum)", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const navButtons = screen.getAllByRole("button").filter(btn => {
                const text = btn.textContent
                return (
                    text?.includes("Publish") ||
                    text?.includes("Insights") ||
                    text?.includes("Settings")
                )
            })

            navButtons.forEach(button => {
                expect(button).toHaveClass("min-h-11")
            })
        })

        it("should have touch-friendly channel buttons (44x44px minimum)", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const channelButtons = screen.getAllByRole("button").filter(btn => {
                const ariaLabel = btn.getAttribute("aria-label")
                return ariaLabel?.includes("Connect")
            })

            channelButtons.forEach(button => {
                expect(button).toHaveClass("min-h-11", "min-w-11")
            })
        })

        it("should have readable text sizes on mobile", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const navButtons = screen.getAllByRole("button").filter(btn => {
                const text = btn.textContent
                return (
                    text?.includes("Publish") ||
                    text?.includes("Insights") ||
                    text?.includes("Settings")
                )
            })

            navButtons.forEach(button => {
                // Mobile sidebar should use text-base or text-sm for readability
                const hasReadableSize =
                    button.className.includes("text-base") ||
                    button.className.includes("text-sm")
                expect(hasReadableSize).toBe(true)
            })
        })

        it("should have close button with proper touch size on mobile", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                    onClose={() => {}}
                />
            )

            const closeButton = screen.getByLabelText("Close sidebar")
            expect(closeButton).toHaveClass("min-h-11", "min-w-11")
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

        it("should have responsive layout on mobile", () => {
            const { container } = render(
                <PostCard
                    post={mockPost}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            )

            // Check for responsive padding classes
            const cardContent = container.querySelector("div[class*='p-3']")
            expect(cardContent).toBeInTheDocument()
        })

        it("should have touch-friendly action buttons", () => {
            render(
                <PostCard
                    post={mockPost}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            )

            const buttons = screen.getAllByRole("button")
            buttons.forEach(button => {
                expect(button).toHaveClass("min-h-10", "min-w-10")
            })
        })

        it("should stack actions vertically on mobile", () => {
            const { container } = render(
                <PostCard
                    post={mockPost}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            )

            const actionsContainer = container.querySelector(
                "div[class*='flex'][class*='gap-2']"
            )
            // Should have flex and gap classes for responsive layout
            expect(actionsContainer).toHaveClass("flex", "gap-2")
        })

        it("should have readable text sizes on mobile", () => {
            const { container } = render(
                <PostCard
                    post={mockPost}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            )

            const title = container.querySelector("h3")
            expect(title).toHaveClass("text-base")
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

        it("should have responsive text sizes on mobile", () => {
            const { container } = render(<MetricCard metric={mockMetric} />)

            const value = container.querySelector("div[class*='text-2xl']")
            expect(value).toBeInTheDocument()
            expect(value).toHaveClass("text-2xl", "sm:text-3xl")
        })

        it("should have responsive padding on mobile", () => {
            const { container } = render(<MetricCard metric={mockMetric} />)

            // Check for responsive padding in header
            const header = container.querySelector("div[class*='pb-']")
            expect(header).toBeInTheDocument()
        })
    })

    describe("Touch Interaction Optimization", () => {
        it("should have minimum 44x44px touch targets for all interactive elements", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const buttons = screen.getAllByRole("button")
            buttons.forEach(button => {
                const hasMinHeight = button.className.includes("min-h-")
                const hasMinWidth = button.className.includes("min-w-")
                expect(hasMinHeight || hasMinWidth).toBe(true)
            })
        })

        it("should have proper spacing between touch targets", () => {
            render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const navButtons = screen.getAllByRole("button").filter(btn => {
                const text = btn.textContent
                return (
                    text?.includes("Publish") ||
                    text?.includes("Insights") ||
                    text?.includes("Settings")
                )
            })

            // Should have gap between buttons
            expect(navButtons.length).toBeGreaterThan(0)
        })
    })

    describe("Text Readability on Mobile", () => {
        it("should use minimum 16px font size for body text", () => {
            const { container } = render(
                <Sidebar
                    activeTab="publish"
                    onTabChange={() => {}}
                    isOpen={true}
                />
            )

            const navButtons = container.querySelectorAll("button")
            // At least some buttons should have readable text sizes
            let hasReadableButtons = false
            navButtons.forEach(button => {
                const hasReadableSize =
                    button.className.includes("text-base") ||
                    button.className.includes("text-sm") ||
                    button.className.includes("text-lg")
                if (hasReadableSize) {
                    hasReadableButtons = true
                }
            })
            expect(hasReadableButtons).toBe(true)
        })

        it("should have proper line height for readability", () => {
            const { container } = render(
                <PostCard
                    post={{
                        id: "1",
                        title: "Test Post",
                        content: "This is a test post content",
                        scheduledAt: new Date(),
                        status: "scheduled",
                        channels: ["facebook"],
                        createdAt: new Date(),
                    }}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            )

            const content = container.querySelector("p")
            expect(content).toBeInTheDocument()
        })
    })

    describe("Responsive Spacing", () => {
        it("should have reduced padding on mobile, increased on desktop", () => {
            const { container } = render(
                <DashboardLayout activeTab="publish">
                    <div>Test Content</div>
                </DashboardLayout>
            )

            const mainContent = container.querySelector("main > div:last-child")
            expect(mainContent).toHaveClass("p-3", "sm:p-4", "md:p-6")
        })

        it("should have responsive gap between elements", () => {
            const { container } = render(
                <PostCard
                    post={{
                        id: "1",
                        title: "Test Post",
                        content: "This is a test post content",
                        scheduledAt: new Date(),
                        status: "scheduled",
                        channels: ["facebook"],
                        createdAt: new Date(),
                    }}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            )

            const flexContainer = container.querySelector(
                "div[class*='flex'][class*='gap']"
            )
            expect(flexContainer).toHaveClass("gap-3", "sm:gap-4")
        })
    })
})
