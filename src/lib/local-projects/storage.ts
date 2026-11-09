/**
 * Local Project & Channel Store
 *
 * Persists local projects, multi-dimensional quotas, and channel bindings
 * directly and solely in client-side localStorage.
 */

import type {
    LocalChannelProjectBinding,
    LocalExecutionConfig,
    LocalProject,
    PlatformType,
    QuotaBucketType,
} from "./types"

const STORAGE_KEY = "local_execution_projects_v1"

export const DEFAULT_PLATFORM_QUOTAS: Record<
    PlatformType,
    Record<QuotaBucketType, { maxLimit: number; periodMs: number }>
> = {
    youtube: {
        daily_units: { maxLimit: 10000, periodMs: 24 * 60 * 60 * 1000 },
        read_requests: { maxLimit: 100, periodMs: 1000 },
        write_requests: { maxLimit: 10, periodMs: 1000 },
        chat_polling: { maxLimit: 60, periodMs: 60 * 1000 },
    },
    meta: {
        daily_units: { maxLimit: 200, periodMs: 60 * 60 * 1000 },
        read_requests: { maxLimit: 50, periodMs: 1000 },
        write_requests: { maxLimit: 25, periodMs: 1000 },
        chat_polling: { maxLimit: 30, periodMs: 60 * 1000 },
    },
    twitch: {
        daily_units: { maxLimit: 800, periodMs: 60 * 1000 },
        read_requests: { maxLimit: 30, periodMs: 1000 },
        write_requests: { maxLimit: 20, periodMs: 1000 },
        chat_polling: { maxLimit: 100, periodMs: 60 * 1000 },
    },
    kick: {
        daily_units: { maxLimit: 500, periodMs: 60 * 1000 },
        read_requests: { maxLimit: 20, periodMs: 1000 },
        write_requests: { maxLimit: 10, periodMs: 1000 },
        chat_polling: { maxLimit: 60, periodMs: 60 * 1000 },
    },
    tiktok: {
        daily_units: { maxLimit: 1000, periodMs: 60 * 60 * 1000 },
        read_requests: { maxLimit: 20, periodMs: 1000 },
        write_requests: { maxLimit: 10, periodMs: 1000 },
        chat_polling: { maxLimit: 30, periodMs: 60 * 1000 },
    },
    twitter: {
        daily_units: { maxLimit: 300, periodMs: 15 * 60 * 1000 },
        read_requests: { maxLimit: 15, periodMs: 1000 },
        write_requests: { maxLimit: 5, periodMs: 1000 },
        chat_polling: { maxLimit: 15, periodMs: 60 * 1000 },
    },
    linkedin: {
        daily_units: { maxLimit: 500, periodMs: 24 * 60 * 60 * 1000 },
        read_requests: { maxLimit: 20, periodMs: 1000 },
        write_requests: { maxLimit: 10, periodMs: 1000 },
        chat_polling: { maxLimit: 10, periodMs: 60 * 1000 },
    },
    kwai: {
        daily_units: { maxLimit: 500, periodMs: 24 * 60 * 60 * 1000 },
        read_requests: { maxLimit: 20, periodMs: 1000 },
        write_requests: { maxLimit: 10, periodMs: 1000 },
        chat_polling: { maxLimit: 10, periodMs: 60 * 1000 },
    },
}

function loadConfig(): LocalExecutionConfig {
    if (typeof window === "undefined") {
        return { version: 1, projects: [], channels: [] }
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { version: 1, projects: [], channels: [] }
        const parsed = JSON.parse(raw) as LocalExecutionConfig
        return {
            version: 1,
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            channels: Array.isArray(parsed.channels) ? parsed.channels : [],
        }
    } catch {
        return { version: 1, projects: [], channels: [] }
    }
}

function saveConfig(config: LocalExecutionConfig): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function getLocalProjects(platform?: PlatformType): LocalProject[] {
    const config = loadConfig()
    if (!platform) return config.projects
    return config.projects.filter(p => p.platform === platform)
}

export function getLocalProjectById(
    projectId: string
): LocalProject | undefined {
    const config = loadConfig()
    return config.projects.find(p => p.id === projectId)
}

export function saveLocalProject(
    projectData: Omit<LocalProject, "createdAt" | "updatedAt" | "quotas" | "status"> & {
        quotas?: Partial<LocalProject["quotas"]>
        status?: LocalProject["status"]
    }
): LocalProject {
    const config = loadConfig()
    const now = Date.now()
    const existingIndex = config.projects.findIndex(p => p.id === projectData.id)

    const defaultLimits = DEFAULT_PLATFORM_QUOTAS[projectData.platform]
    const defaultQuotas: LocalProject["quotas"] = {
        daily_units: {
            maxLimit: defaultLimits.daily_units.maxLimit,
            periodMs: defaultLimits.daily_units.periodMs,
            resetTime: now + defaultLimits.daily_units.periodMs,
            currentUsage: 0,
            ...(projectData.quotas?.daily_units || {}),
        },
        read_requests: {
            maxLimit: defaultLimits.read_requests.maxLimit,
            periodMs: defaultLimits.read_requests.periodMs,
            resetTime: now + defaultLimits.read_requests.periodMs,
            currentUsage: 0,
            ...(projectData.quotas?.read_requests || {}),
        },
        write_requests: {
            maxLimit: defaultLimits.write_requests.maxLimit,
            periodMs: defaultLimits.write_requests.periodMs,
            resetTime: now + defaultLimits.write_requests.periodMs,
            currentUsage: 0,
            ...(projectData.quotas?.write_requests || {}),
        },
        chat_polling: {
            maxLimit: defaultLimits.chat_polling.maxLimit,
            periodMs: defaultLimits.chat_polling.periodMs,
            resetTime: now + defaultLimits.chat_polling.periodMs,
            currentUsage: 0,
            ...(projectData.quotas?.chat_polling || {}),
        },
    }

    if (existingIndex >= 0) {
        const existing = config.projects[existingIndex]
        const updated: LocalProject = {
            ...existing,
            ...projectData,
            quotas: {
                ...existing.quotas,
                ...(projectData.quotas || {}),
            },
            status: projectData.status || existing.status,
            updatedAt: now,
        }
        config.projects[existingIndex] = updated
        saveConfig(config)
        return updated
    }

    const created: LocalProject = {
        id: projectData.id,
        name: projectData.name,
        platform: projectData.platform,
        clientId: projectData.clientId,
        clientSecret: projectData.clientSecret,
        apiKey: projectData.apiKey,
        quotas: defaultQuotas,
        status: projectData.status || "active",
        createdAt: now,
        updatedAt: now,
    }

    config.projects.push(created)
    saveConfig(config)
    return created
}

export function deleteLocalProject(projectId: string): void {
    const config = loadConfig()
    config.projects = config.projects.filter(p => p.id !== projectId)
    // Remove binding references to this project
    config.channels = config.channels.map(ch => ({
        ...ch,
        projectIds: ch.projectIds.filter(id => id !== projectId),
        auths: ch.auths.filter(a => a.projectId !== projectId),
    }))
    saveConfig(config)
}

export function getLocalChannels(
    platform?: PlatformType
): LocalChannelProjectBinding[] {
    const config = loadConfig()
    if (!platform) return config.channels
    return config.channels.filter(c => c.platform === platform)
}

export function getLocalChannelById(
    channelId: string,
    platform: PlatformType
): LocalChannelProjectBinding | undefined {
    const config = loadConfig()
    return config.channels.find(
        c => c.channelId === channelId && c.platform === platform
    )
}

export function saveLocalChannelBinding(
    binding: Omit<LocalChannelProjectBinding, "createdAt" | "updatedAt">
): LocalChannelProjectBinding {
    const config = loadConfig()
    const now = Date.now()
    const existingIndex = config.channels.findIndex(
        c => c.channelId === binding.channelId && c.platform === binding.platform
    )

    if (existingIndex >= 0) {
        const existing = config.channels[existingIndex]
        const updated: LocalChannelProjectBinding = {
            ...existing,
            ...binding,
            updatedAt: now,
        }
        config.channels[existingIndex] = updated
        saveConfig(config)
        return updated
    }

    const created: LocalChannelProjectBinding = {
        ...binding,
        createdAt: now,
        updatedAt: now,
    }
    config.channels.push(created)
    saveConfig(config)
    return created
}

export function removeLocalChannelBinding(
    channelId: string,
    platform: PlatformType
): void {
    const config = loadConfig()
    config.channels = config.channels.filter(
        c => !(c.channelId === channelId && c.platform === platform)
    )
    saveConfig(config)
}

export function clearAllLocalProjects(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
}
