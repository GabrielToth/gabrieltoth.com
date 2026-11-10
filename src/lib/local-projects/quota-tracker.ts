/**
 * Local Quota Tracker & Project Selector
 *
 * Implements N:N quota routing:
 * - Checks fine-grained multi-bucket quotas per project (daily units, read requests, write requests, chat polling).
 * - Rotates automatically across projects bound to a channel or belonging to the platform pool.
 * - Handles quota exhaustion and rate limit backoff completely inside the browser.
 */

import { getLocalProjects, saveLocalProject } from "./storage"
import type { LocalProject, PlatformType, QuotaBucketType } from "./types"

export interface SelectProjectResult {
    project: LocalProject
    availableQuota: number
    bucket: QuotaBucketType
}

/**
 * Resets quota bucket if its period has passed
 */
export function refreshProjectQuotas(project: LocalProject): LocalProject {
    const now = Date.now()
    let changed = false
    const updatedQuotas = { ...project.quotas }

    for (const [key, bucket] of Object.entries(updatedQuotas) as [
        QuotaBucketType,
        LocalProject["quotas"][QuotaBucketType],
    ][]) {
        if (now >= bucket.resetTime) {
            updatedQuotas[key] = {
                ...bucket,
                currentUsage: 0,
                resetTime: now + bucket.periodMs,
            }
            changed = true
        }
    }

    let status = project.status
    if (project.retryAfter && now >= project.retryAfter) {
        status = "active"
        changed = true
    } else if (
        status === "exhausted" &&
        updatedQuotas.daily_units.currentUsage <
            updatedQuotas.daily_units.maxLimit
    ) {
        status = "active"
        changed = true
    }

    if (changed) {
        return saveLocalProject({
            ...project,
            quotas: updatedQuotas,
            status,
            retryAfter: status === "active" ? undefined : project.retryAfter,
        })
    }

    return project
}

/**
 * Checks whether a project has sufficient capacity in a specific quota bucket.
 */
export function hasCapacity(
    project: LocalProject,
    bucket: QuotaBucketType,
    cost: number = 1
): boolean {
    const refreshed = refreshProjectQuotas(project)
    if (
        refreshed.status === "exhausted" ||
        refreshed.status === "invalid_keys"
    ) {
        return false
    }
    if (refreshed.status === "rate_limited") {
        if (refreshed.retryAfter && Date.now() < refreshed.retryAfter) {
            return false
        }
    }

    const quota = refreshed.quotas[bucket]
    if (!quota) return true
    return quota.currentUsage + cost <= quota.maxLimit
}

/**
 * Selects the best project for an operation from a candidate list (N:N distribution).
 * Picks the active project with the lowest quota consumption ratio for the required bucket.
 */
export function selectBestProject(
    candidateProjectIds: string[],
    platform: PlatformType,
    bucket: QuotaBucketType = "read_requests",
    cost: number = 1
): SelectProjectResult | null {
    const allProjects = getLocalProjects(platform)
    const candidates =
        candidateProjectIds.length > 0
            ? allProjects.filter(p => candidateProjectIds.includes(p.id))
            : allProjects

    if (candidates.length === 0) {
        return null
    }

    // Filter available projects
    const available = candidates
        .map(p => refreshProjectQuotas(p))
        .filter(p => hasCapacity(p, bucket, cost))

    if (available.length === 0) {
        return null
    }

    // Sort by lowest utilization ratio (currentUsage / maxLimit)
    available.sort((a, b) => {
        const ratioA = a.quotas[bucket].currentUsage / a.quotas[bucket].maxLimit
        const ratioB = b.quotas[bucket].currentUsage / b.quotas[bucket].maxLimit
        return ratioA - ratioB
    })

    const selected = available[0]
    const remaining =
        selected.quotas[bucket].maxLimit - selected.quotas[bucket].currentUsage

    return {
        project: selected,
        availableQuota: remaining,
        bucket,
    }
}

/**
 * Consumes quota on a project after an operation succeeded.
 */
export function recordQuotaConsumption(
    projectId: string,
    bucket: QuotaBucketType,
    unitsConsumed: number = 1
): LocalProject | undefined {
    const all = getLocalProjects()
    const proj = all.find(p => p.id === projectId)
    if (!proj) return undefined

    const refreshed = refreshProjectQuotas(proj)
    const current = refreshed.quotas[bucket]
    const newUsage = current.currentUsage + unitsConsumed
    const isExhausted = newUsage >= current.maxLimit

    return saveLocalProject({
        ...refreshed,
        quotas: {
            ...refreshed.quotas,
            [bucket]: {
                ...current,
                currentUsage: newUsage,
            },
        },
        status:
            isExhausted && bucket === "daily_units"
                ? "exhausted"
                : refreshed.status,
    })
}

/**
 * Reports a rate-limit error (429 / 403 quotaExceeded) to immediately pause
 * this project and let the system switch to another one in the pool.
 */
export function markProjectRateLimited(
    projectId: string,
    backoffMs: number = 60000,
    isQuotaExceeded: boolean = false
): LocalProject | undefined {
    const all = getLocalProjects()
    const proj = all.find(p => p.id === projectId)
    if (!proj) return undefined

    return saveLocalProject({
        ...proj,
        status: isQuotaExceeded ? "exhausted" : "rate_limited",
        retryAfter: Date.now() + backoffMs,
    })
}
