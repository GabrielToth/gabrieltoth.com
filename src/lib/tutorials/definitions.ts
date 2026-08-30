import type { Tutorial } from "./types"

/**
 * Tutorial definitions for each dashboard category plus the first-run
 * onboarding flow that guides a brand-new user from account creation to
 * their first post.
 *
 * Targets are CSS selectors. Wherever possible we use stable, semantic
 * selectors so the tutorial keeps working as the UI evolves. In a few cases
 * the dashboard already exposes aria-labels / ids we can hook into — the
 * fallback is a data-attribute selector (`[data-tutorial="..."]`).
 */

export const ONBOARDING_TUTORIAL: Tutorial = {
    id: "onboarding",
    category: "onboarding",
    titleKey: "titles.onboarding",
    isOnboarding: true,
    steps: [
        {
            index: 0,
            target: '[data-tutorial="publish"]',
            title: "welcome.title",
            description: "welcome.description",
            placement: "bottom",
        },
        {
            index: 1,
            target: '[data-tutorial="publish-composer"]',
            title: "composer.title",
            description: "composer.description",
            placement: "top",
        },
        {
            index: 2,
            target: '[data-tutorial="network-select"]',
            title: "network.title",
            description: "network.description",
            placement: "top",
        },
        {
            index: 3,
            target: '[data-tutorial="content-type"]',
            title: "content.title",
            description: "content.description",
            placement: "top",
        },
        {
            index: 4,
            target: '[data-tutorial="publish-submit"]',
            title: "submit.title",
            description: "submit.description",
            placement: "bottom",
        },
    ],
}

export const CATEGORY_TUTORIALS: Tutorial[] = [
    ONBOARDING_TUTORIAL,
    {
        id: "publish",
        category: "publish",
        titleKey: "titles.publish",
        steps: [
            {
                index: 0,
                target: '[data-tutorial="publish-composer"]',
                title: "publishComposer.title",
                description: "publishComposer.description",
            },
            {
                index: 1,
                target: '[data-tutorial="network-select"]',
                title: "network.title",
                description: "publishNetwork.description",
            },
            {
                index: 2,
                target: '[data-tutorial="publish-submit"]',
                title: "submit.title",
                description: "submit.description",
            },
        ],
    },
    {
        id: "channels",
        category: "channels",
        titleKey: "titles.channels",
        steps: [
            {
                index: 0,
                target: '[data-tutorial="channels-list"]',
                title: "channelsList.title",
                description: "channelsList.description",
            },
            {
                index: 1,
                target: '[data-tutorial="channels-connect"]',
                title: "channelsConnect.title",
                description: "channelsConnect.description",
            },
        ],
    },
    {
        id: "live",
        category: "live",
        titleKey: "titles.live",
        steps: [
            {
                index: 0,
                target: '[data-tutorial="live-stream-health"]',
                title: "liveHealth.title",
                description: "liveHealth.description",
            },
            {
                index: 1,
                target: '[data-tutorial="live-chat"]',
                title: "liveChat.title",
                description: "liveChat.description",
            },
        ],
    },
    {
        id: "insights",
        category: "insights",
        titleKey: "titles.insights",
        steps: [
            {
                index: 0,
                target: '[data-tutorial="insights-metrics"]',
                title: "insightsMetrics.title",
                description: "insightsMetrics.description",
            },
            {
                index: 1,
                target: '[data-tutorial="insights-channels"]',
                title: "insightsChannels.title",
                description: "insightsChannels.description",
            },
        ],
    },
    {
        id: "discover",
        category: "discover",
        titleKey: "titles.discover",
        steps: [
            {
                index: 0,
                target: '[data-tutorial="discover-import"]',
                title: "discoverImport.title",
                description: "discoverImport.description",
            },
            {
                index: 1,
                target: '[data-tutorial="discover-list"]',
                title: "discoverList.title",
                description: "discoverList.description",
            },
        ],
    },
    {
        id: "repost",
        category: "repost",
        titleKey: "titles.repost",
        steps: [
            {
                index: 0,
                target: '[data-tutorial="repost-schedule"]',
                title: "repostSchedule.title",
                description: "repostSchedule.description",
            },
        ],
    },
    {
        id: "cloner",
        category: "cloner",
        titleKey: "titles.cloner",
        steps: [
            {
                index: 0,
                target: '[data-tutorial="cloner-import"]',
                title: "clonerImport.title",
                description: "clonerImport.description",
            },
        ],
    },
    {
        id: "settings",
        category: "settings",
        titleKey: "titles.settings",
        steps: [
            {
                index: 0,
                target: '[data-tutorial="settings-profile"]',
                title: "settingsProfile.title",
                description: "settingsProfile.description",
            },
            {
                index: 1,
                target: '[data-tutorial="settings-security"]',
                title: "settingsSecurity.title",
                description: "settingsSecurity.description",
            },
        ],
    },
]

export function getTutorialById(id: string | null | undefined): Tutorial | null {
    if (!id) return null
    return CATEGORY_TUTORIALS.find(t => t.id === id) ?? null
}

export function getTutorialsForCategory(
    category: string
): Tutorial[] {
    return CATEGORY_TUTORIALS.filter(t => t.category === category)
}
