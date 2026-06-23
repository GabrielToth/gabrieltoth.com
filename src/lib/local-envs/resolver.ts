import type { EnvMode } from "./types"
import { getEnvVarValue, getServiceMode } from "./storage"

export interface ResolvedEnvResult {
    value: string | undefined
    source: "local" | "cloud"
    mode: EnvMode
}

function getCloudEnv(key: string): string | undefined {
    return process.env[key] ?? undefined
}

export function resolveEnv(serviceId: string, key: string): ResolvedEnvResult {
    const mode = getServiceMode(serviceId)
    const localValue = getEnvVarValue(serviceId, key)
    const cloudValue = getCloudEnv(key)

    switch (mode) {
        case "local_only":
            return {
                value: localValue,
                source: "local",
                mode,
            }

        case "local_preferred":
            if (localValue !== undefined) {
                return { value: localValue, source: "local", mode }
            }
            return { value: cloudValue, source: "cloud", mode }

        case "cloud_preferred":
            if (cloudValue !== undefined) {
                return { value: cloudValue, source: "cloud", mode }
            }
            return { value: localValue, source: "local", mode }

        case "cloud_only":
            return {
                value: cloudValue,
                source: "cloud",
                mode,
            }
    }
}

export function resolveEnvs(
    serviceId: string,
    keys: string[]
): Record<string, ResolvedEnvResult> {
    const result: Record<string, ResolvedEnvResult> = {}
    for (const key of keys) {
        result[key] = resolveEnv(serviceId, key)
    }
    return result
}

export function shouldUseLocalApi(serviceId: string): boolean {
    const mode = getServiceMode(serviceId)
    return mode === "local_only" || mode === "local_preferred"
}

export function hasLocalEnvs(serviceId: string): boolean {
    const service = getServiceMode(serviceId)
    return service !== "cloud_only"
}
