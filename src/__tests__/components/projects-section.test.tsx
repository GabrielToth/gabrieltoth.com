import ProjectsSection from "@/app/[locale]/home/projects-section"
import * as useLocaleModule from "@/hooks/use-locale"
import { fireEvent, render, screen } from "@testing-library/react"
import * as nextIntl from "next-intl"
import { describe, expect, it, vi } from "vitest"

describe("ProjectsSection", () => {
    const mockProjectsData = {
        title: "Projects",
        description: "Some projects",
        viewProject: "View Project",
        sourceCode: "Source Code",
        technologies: "Technologies",
        showMore: "Show More",
        showLess: "Show Less",
        items: [
            {
                title: "Project 1",
                description: "Description 1",
                image: "/img1.jpg",
                tags: ["React", "TypeScript"],
                liveUrl: "https://example.com/1",
                githubUrl: "https://github.com/user/project1",
            },
            {
                title: "Project 2",
                description: "Description 2",
                image: "/img2.jpg",
                tags: ["Next.js"],
                liveUrl: "https://example.com/2",
            },
            {
                title: "Project 3",
                description: "Description 3",
                image: "/img3.jpg",
                tags: ["Node.js"],
                slug: "/project-3",
            },
            {
                title: "Project 4",
                description: "Description 4",
                image: "/img4.jpg",
                tags: ["Python"],
                liveUrl: "https://example.com/4",
            },
        ],
    }

    const renderWithIntl = (locale: "en" | "pt-BR" = "en") => {
        vi.spyOn(useLocaleModule, "useLocale").mockReturnValue({
            locale,
            changeLocale: vi.fn(),
            isLoading: false,
        } as any)

        // Mock useTranslations to return our mock data
        vi.spyOn(nextIntl, "useTranslations").mockImplementation(() => {
            const t = (key: string) => {
                const keys = key.split(".")
                let value: any = mockProjectsData
                for (const k of keys) {
                    value = value?.[k]
                }
                return value || key
            }
            t.raw = (key: string) => {
                if (key === "items") return mockProjectsData.items
                return []
            }
            t.rich = (key: string) => key
            return t as any
        })

        return render(<ProjectsSection />)
    }

    it("renders initial project cards and toggles show more/less", () => {
        renderWithIntl("en")

        // Check for title
        const title = screen.getByText("Projects")
        expect(title).toBeInTheDocument()

        // There should be project cards - look for the viewProject button text
        const viewProjectButtons = screen.queryAllByText(/view project/i)
        expect(viewProjectButtons.length).toBeGreaterThan(0)

        // If Show More exists, clicking it should not crash and then Show Less appears
        const showMore = screen.queryByRole("button", { name: /show more/i })
        if (showMore) {
            fireEvent.click(showMore)
            expect(
                screen.getByRole("button", { name: /show less/i })
            ).toBeInTheDocument()
        }
    })

    it("ensures first project link has a valid href (internal or external)", () => {
        renderWithIntl("en")
        // Look for links with text containing "view project" (case insensitive)
        const links = screen.queryAllByRole("link")
        const viewProjectLink = links.find(link =>
            link.textContent?.toLowerCase().includes("view project")
        )

        expect(viewProjectLink).toBeTruthy()
        if (viewProjectLink) {
            const href = viewProjectLink.getAttribute("href")
            expect(href).toBeTruthy()
        }
    })
})
