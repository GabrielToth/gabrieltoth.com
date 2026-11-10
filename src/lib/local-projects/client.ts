/**
 * Direct Client-Side Platform API Client (Local Execution Mode)
 *
 * ZERO BACKEND / ZERO CLOUD:
 * Executes REST calls directly from the user's browser to the platform APIs
 * using the user's BYO keys & tokens.
 * Intercepts quotas and auto-rotates across candidate projects.
 */

import {
    markProjectRateLimited,
    recordQuotaConsumption,
    selectBestProject,
} from "./quota-tracker"
import { getLocalChannelById, getLocalProjects } from "./storage"
import type { PlatformType, QuotaBucketType } from "./types"

export interface DirectApiCallOptions {
    channelId?: string
    candidateProjectIds?: string[]
    bucket?: QuotaBucketType
    cost?: number
    endpoint: string
    method?: "GET" | "POST" | "PUT" | "DELETE"
    headers?: Record<string, string>
    body?: any
}

export interface DirectApiResponse<T = any> {
    ok: boolean
    status: number
    data?: T
    error?: string
    projectIdUsed?: string
}

export class LocalPlatformApiClient {
    /**
     * Executes a direct client-side fetch to the platform API with automatic project rotation.
     */
    static async execute<T = any>(
        platform: PlatformType,
        options: DirectApiCallOptions
    ): Promise<DirectApiResponse<T>> {
        const bucket =
            options.bucket ||
            (options.method === "POST" ? "write_requests" : "read_requests")
        const cost = options.cost || 1

        let candidateProjectIds = options.candidateProjectIds || []

        // If a channelId was provided, look up its bound project IDs
        if (candidateProjectIds.length === 0 && options.channelId) {
            const binding = getLocalChannelById(options.channelId, platform)
            if (binding && binding.projectIds.length > 0) {
                candidateProjectIds = binding.projectIds
            }
        }

        // If still empty, fall back to all projects for that platform
        if (candidateProjectIds.length === 0) {
            candidateProjectIds = getLocalProjects(platform).map(p => p.id)
        }

        const selection = selectBestProject(
            candidateProjectIds,
            platform,
            bucket,
            cost
        )

        if (!selection) {
            return {
                ok: false,
                status: 429,
                error: `No local projects with sufficient '${bucket}' quota available for ${platform}.`,
            }
        }

        const project = selection.project

        // Get channel auth token if bound
        let token: string | undefined
        if (options.channelId) {
            const binding = getLocalChannelById(options.channelId, platform)
            token = binding?.auths.find(
                a => a.projectId === project.id
            )?.accessToken
        }

        // Build request headers
        const headers: Record<string, string> = {
            ...(options.headers || {}),
        }

        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }

        // Handle URL API key substitution if needed (e.g. YouTube Data API public calls)
        let url = options.endpoint
        if (project.apiKey && !token) {
            const separator = url.includes("?") ? "&" : "?"
            url = `${url}${separator}key=${encodeURIComponent(project.apiKey)}`
        }

        try {
            const response = await fetch(url, {
                method: options.method || "GET",
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
            })

            if (response.status === 429) {
                // Rate limited
                markProjectRateLimited(project.id, 60000, false)
                return {
                    ok: false,
                    status: 429,
                    error: `Rate limit reached on local project ${project.name}.`,
                    projectIdUsed: project.id,
                }
            }

            if (response.status === 403) {
                const bodyText = await response.clone().text()
                if (bodyText.includes("quotaExceeded")) {
                    markProjectRateLimited(
                        project.id,
                        24 * 60 * 60 * 1000,
                        true
                    )
                    return {
                        ok: false,
                        status: 403,
                        error: `Quota exceeded on local project ${project.name}. Switched to fallback if available.`,
                        projectIdUsed: project.id,
                    }
                }
            }

            if (!response.ok) {
                const errText = await response.text()
                return {
                    ok: false,
                    status: response.status,
                    error: errText || response.statusText,
                    projectIdUsed: project.id,
                }
            }

            // Success: record quota consumption
            recordQuotaConsumption(project.id, bucket, cost)
            if (bucket !== "daily_units") {
                recordQuotaConsumption(project.id, "daily_units", cost)
            }

            const data = (await response.json()) as T
            return {
                ok: true,
                status: response.status,
                data,
                projectIdUsed: project.id,
            }
        } catch (err: any) {
            return {
                ok: false,
                status: 0,
                error: err instanceof Error ? err.message : "Network error",
                projectIdUsed: project.id,
            }
        }
    }
}
