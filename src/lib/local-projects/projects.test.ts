import { beforeEach, describe, expect, it } from "vitest"
import {
    clearAllLocalProjects,
    deleteLocalProject,
    getLocalChannelById,
    getLocalChannels,
    getLocalProjectById,
    getLocalProjects,
    hasCapacity,
    markProjectRateLimited,
    recordQuotaConsumption,
    refreshProjectQuotas,
    removeLocalChannelBinding,
    saveLocalChannelBinding,
    saveLocalProject,
    selectBestProject,
} from "./index"

describe("Local Projects & Quota Engine (N:N Distribution)", () => {
    beforeEach(() => {
        clearAllLocalProjects()
    })

    it("saves and retrieves local projects with multi-bucket quotas", () => {
        const proj = saveLocalProject({
            id: "yt-proj-1",
            name: "YouTube Console 1",
            platform: "youtube",
            clientId: "client-id-1",
            apiKey: "api-key-1",
        })

        expect(proj.id).toBe("yt-proj-1")
        expect(proj.quotas.daily_units.maxLimit).toBe(10000)
        expect(proj.quotas.read_requests.maxLimit).toBe(100)
        expect(proj.status).toBe("active")

        const retrieved = getLocalProjectById("yt-proj-1")
        expect(retrieved?.name).toBe("YouTube Console 1")
    })

    it("supports N:N channel-to-project bindings", () => {
        saveLocalProject({
            id: "proj-a",
            name: "Project A",
            platform: "youtube",
        })
        saveLocalProject({
            id: "proj-b",
            name: "Project B",
            platform: "youtube",
        })

        // Channel 1 bound to both Project A and Project B
        const binding = saveLocalChannelBinding({
            channelId: "UC_100_TEST",
            channelName: "Live Stream Channel 100",
            platform: "youtube",
            projectIds: ["proj-a", "proj-b"],
            auths: [
                { projectId: "proj-a", accessToken: "token-a" },
                { projectId: "proj-b", accessToken: "token-b" },
            ],
        })

        expect(binding.projectIds).toHaveLength(2)
        expect(binding.auths).toHaveLength(2)

        const retrieved = getLocalChannelById("UC_100_TEST", "youtube")
        expect(retrieved?.projectIds).toContain("proj-a")
        expect(retrieved?.projectIds).toContain("proj-b")

        const all = getLocalChannels("youtube")
        expect(all).toHaveLength(1)
    })

    it("rotates and balances across projects based on quota pressure", () => {
        saveLocalProject({
            id: "proj-a",
            name: "Project A",
            platform: "youtube",
        })
        saveLocalProject({
            id: "proj-b",
            name: "Project B",
            platform: "youtube",
        })

        // Consume quota on Project A
        recordQuotaConsumption("proj-a", "read_requests", 50)

        // Project B has 0 consumed, so it should be selected over Project A
        const selected = selectBestProject(
            ["proj-a", "proj-b"],
            "youtube",
            "read_requests",
            1
        )
        expect(selected).not.toBeNull()
        expect(selected?.project.id).toBe("proj-b")
    })

    it("switches automatically to fallback when a project daily quota is exhausted", () => {
        saveLocalProject({
            id: "proj-a",
            name: "Project A",
            platform: "youtube",
        })
        saveLocalProject({
            id: "proj-b",
            name: "Project B",
            platform: "youtube",
        })

        // Exhaust Project A
        recordQuotaConsumption("proj-a", "daily_units", 10000)

        const projA = getLocalProjectById("proj-a")
        expect(projA?.status).toBe("exhausted")
        expect(hasCapacity(projA!, "daily_units", 1)).toBe(false)

        // Select for channel with both projects bound
        const selected = selectBestProject(
            ["proj-a", "proj-b"],
            "youtube",
            "daily_units",
            1
        )
        expect(selected).not.toBeNull()
        expect(selected?.project.id).toBe("proj-b")
    })

    it("handles rate limiting backoff cleanly without touching backend", () => {
        saveLocalProject({
            id: "proj-rate",
            name: "Rate Limited Proj",
            platform: "twitch",
        })

        markProjectRateLimited("proj-rate", 5000, false)
        const proj = getLocalProjectById("proj-rate")
        expect(proj?.status).toBe("rate_limited")
        expect(hasCapacity(proj!, "read_requests", 1)).toBe(false)

        // If time passes past retryAfter, status resets to active
        const simulated = {
            ...proj!,
            retryAfter: Date.now() - 100,
        }
        const refreshed = refreshProjectQuotas(simulated)
        expect(refreshed.status).toBe("active")
    })

    it("deleting a project cleans up project references from bound channels", () => {
        saveLocalProject({
            id: "proj-del",
            name: "Delete Me",
            platform: "meta",
        })
        saveLocalChannelBinding({
            channelId: "meta-page-1",
            channelName: "Facebook Page",
            platform: "meta",
            projectIds: ["proj-del"],
            auths: [{ projectId: "proj-del", accessToken: "token-xyz" }],
        })

        deleteLocalProject("proj-del")
        expect(getLocalProjectById("proj-del")).toBeUndefined()

        const channel = getLocalChannelById("meta-page-1", "meta")
        expect(channel?.projectIds).toHaveLength(0)
        expect(channel?.auths).toHaveLength(0)
    })
})
