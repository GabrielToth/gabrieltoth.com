import type { DashboardCategory } from "@/lib/tutorials/types"

export interface DocSection {
    headingKey: string
    bodyKey: string
    /** optional code snippet to display */
    code?: string
}

export interface DocExample {
    titleKey: string
    audience: "individual" | "company"
    bodyKey: string
    steps: string[]
}

export interface CategoryDoc {
    category: DashboardCategory
    /** description of what the feature does and what data is used */
    overviewKey: string
    /** technical / AI-reader summary of the feature intent */
    technicalKey: string
    /** what data is collected / processed */
    dataKey: string
    sections: DocSection[]
    examples: DocExample[]
}

export const CATEGORY_DOCS: CategoryDoc[] = [
    {
        category: "discover",
        overviewKey: "discover.overview",
        technicalKey: "discover.technical",
        dataKey: "discover.data",
        sections: [
            {
                headingKey: "discover.sections.two",
                bodyKey: "discover.sections.twoBody",
            },
            {
                headingKey: "discover.sections.three",
                bodyKey: "discover.sections.threeBody",
                code: `// minimal JSON format (one object per creator)
[
  {
    "userId": "ogabrieltoth",
    "username": "ogabrieltoth",
    "displayName": "Gabriel Toth",
    "avatarUrl": null,
    "platforms": {
      "youtube": { "username": "ogabrieltoth", "displayName": "Gabriel Toth", "profileImageUrl": null, "isLive": false },
      "twitch": { "username": "ogabrieltoth", "displayName": "ogabrieltoth", "profileImageUrl": null, "isLive": false }
    }
  }
]`,
            },
        ],
        examples: [
            {
                titleKey: "discover.examples.individual",
                audience: "individual",
                bodyKey: "discover.examples.individualBody",
                steps: [
                    "discover.examples.individualStep1",
                    "discover.examples.individualStep2",
                    "discover.examples.individualStep3",
                ],
            },
            {
                titleKey: "discover.examples.company",
                audience: "company",
                bodyKey: "discover.examples.companyBody",
                steps: [
                    "discover.examples.companyStep1",
                    "discover.examples.companyStep2",
                    "discover.examples.companyStep3",
                ],
            },
        ],
    },
    {
        category: "publish",
        overviewKey: "publish.overview",
        technicalKey: "publish.technical",
        dataKey: "publish.data",
        sections: [
            {
                headingKey: "publish.sections.two",
                bodyKey: "publish.sections.twoBody",
            },
        ],
        examples: [
            {
                titleKey: "publish.examples.individual",
                audience: "individual",
                bodyKey: "publish.examples.individualBody",
                steps: [
                    "publish.examples.individualStep1",
                    "publish.examples.individualStep2",
                    "publish.examples.individualStep3",
                ],
            },
            {
                titleKey: "publish.examples.company",
                audience: "company",
                bodyKey: "publish.examples.companyBody",
                steps: [
                    "publish.examples.companyStep1",
                    "publish.examples.companyStep2",
                    "publish.examples.companyStep3",
                ],
            },
        ],
    },
    {
        category: "channels",
        overviewKey: "channels.overview",
        technicalKey: "channels.technical",
        dataKey: "channels.data",
        sections: [
            {
                headingKey: "channels.sections.two",
                bodyKey: "channels.sections.twoBody",
            },
        ],
        examples: [
            {
                titleKey: "channels.examples.individual",
                audience: "individual",
                bodyKey: "channels.examples.individualBody",
                steps: [
                    "channels.examples.individualStep1",
                    "channels.examples.individualStep2",
                ],
            },
            {
                titleKey: "channels.examples.company",
                audience: "company",
                bodyKey: "channels.examples.companyBody",
                steps: [
                    "channels.examples.companyStep1",
                    "channels.examples.companyStep2",
                    "channels.examples.companyStep3",
                ],
            },
        ],
    },
    {
        category: "live",
        overviewKey: "live.overview",
        technicalKey: "live.technical",
        dataKey: "live.data",
        sections: [],
        examples: [
            {
                titleKey: "live.examples.individual",
                audience: "individual",
                bodyKey: "live.examples.individualBody",
                steps: ["live.examples.individualStep1"],
            },
            {
                titleKey: "live.examples.company",
                audience: "company",
                bodyKey: "live.examples.companyBody",
                steps: [
                    "live.examples.companyStep1",
                    "live.examples.companyStep2",
                ],
            },
        ],
    },
    {
        category: "insights",
        overviewKey: "insights.overview",
        technicalKey: "insights.technical",
        dataKey: "insights.data",
        sections: [],
        examples: [
            {
                titleKey: "insights.examples.individual",
                audience: "individual",
                bodyKey: "insights.examples.individualBody",
                steps: ["insights.examples.individualStep1"],
            },
            {
                titleKey: "insights.examples.company",
                audience: "company",
                bodyKey: "insights.examples.companyBody",
                steps: [
                    "insights.examples.companyStep1",
                    "insights.examples.companyStep2",
                ],
            },
        ],
    },
    {
        category: "repost",
        overviewKey: "repost.overview",
        technicalKey: "repost.technical",
        dataKey: "repost.data",
        sections: [],
        examples: [
            {
                titleKey: "repost.examples.individual",
                audience: "individual",
                bodyKey: "repost.examples.individualBody",
                steps: ["repost.examples.individualStep1"],
            },
            {
                titleKey: "repost.examples.company",
                audience: "company",
                bodyKey: "repost.examples.companyBody",
                steps: [
                    "repost.examples.companyStep1",
                    "repost.examples.companyStep2",
                ],
            },
        ],
    },
    {
        category: "cloner",
        overviewKey: "cloner.overview",
        technicalKey: "cloner.technical",
        dataKey: "cloner.data",
        sections: [],
        examples: [
            {
                titleKey: "cloner.examples.individual",
                audience: "individual",
                bodyKey: "cloner.examples.individualBody",
                steps: ["cloner.examples.individualStep1"],
            },
            {
                titleKey: "cloner.examples.company",
                audience: "company",
                bodyKey: "cloner.examples.companyBody",
                steps: [
                    "cloner.examples.companyStep1",
                    "cloner.examples.companyStep2",
                ],
            },
        ],
    },
    {
        category: "settings",
        overviewKey: "settings.overview",
        technicalKey: "settings.technical",
        dataKey: "settings.data",
        sections: [],
        examples: [
            {
                titleKey: "settings.examples.individual",
                audience: "individual",
                bodyKey: "settings.examples.individualBody",
                steps: ["settings.examples.individualStep1"],
            },
            {
                titleKey: "settings.examples.company",
                audience: "company",
                bodyKey: "settings.examples.companyBody",
                steps: [
                    "settings.examples.companyStep1",
                    "settings.examples.companyStep2",
                ],
            },
        ],
    },
]

export function getDocForCategory(
    category: string | undefined
): CategoryDoc | null {
    if (!category) return null
    return CATEGORY_DOCS.find(d => d.category === category) ?? null
}
