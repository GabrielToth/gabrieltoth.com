import type {
    EnvMode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    LocalEnvEntry,
    LocalEnvsData,
    ServiceEnvs,
} from "./types"
import { KNOWN_SERVICES, STORAGE_KEY } from "./types"

function getStored(): LocalEnvsData {
    if (typeof window === "undefined") {
        return { version: 1, services: [] }
    }
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { version: 1, services: [] }
        return JSON.parse(raw) as LocalEnvsData
    } catch {
        return { version: 1, services: [] }
    }
}

function persist(data: LocalEnvsData): void {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getServiceEnvs(serviceId: string): ServiceEnvs | undefined {
    const data = getStored()
    return data.services.find(s => s.serviceId === serviceId)
}

export function getAllServiceEnvs(): ServiceEnvs[] {
    return getStored().services
}

export function setServiceMode(serviceId: string, mode: EnvMode): void {
    const data = getStored()
    const existing = data.services.find(s => s.serviceId === serviceId)
    if (existing) {
        existing.mode = mode
    } else {
        const def = KNOWN_SERVICES.find(s => s.id === serviceId)
        data.services.push({
            serviceId,
            serviceName: def?.name ?? serviceId,
            icon: def?.icon ?? "box",
            mode,
            envs: [],
        })
    }
    persist(data)
}

export function setEnvVar(
    serviceId: string,
    key: string,
    value: string,
    label: string
): void {
    const data = getStored()
    let service = data.services.find(s => s.serviceId === serviceId)
    if (!service) {
        const def = KNOWN_SERVICES.find(s => s.id === serviceId)
        service = {
            serviceId,
            serviceName: def?.name ?? serviceId,
            icon: def?.icon ?? "box",
            mode: "cloud_preferred",
            envs: [],
        }
        data.services.push(service)
    }
    const existing = service.envs.find(e => e.key === key)
    if (existing) {
        existing.value = value
    } else {
        service.envs.push({ key, value, label })
    }
    persist(data)
}

export function removeEnvVar(serviceId: string, key: string): void {
    const data = getStored()
    const service = data.services.find(s => s.serviceId === serviceId)
    if (!service) return
    service.envs = service.envs.filter(e => e.key !== key)
    if (service.envs.length === 0 && service.mode === "cloud_only") {
        data.services = data.services.filter(s => s.serviceId !== serviceId)
    }
    persist(data)
}

export function removeService(serviceId: string): void {
    const data = getStored()
    data.services = data.services.filter(s => s.serviceId !== serviceId)
    persist(data)
}

export function getEnvVarValue(
    serviceId: string,
    key: string
): string | undefined {
    const service = getServiceEnvs(serviceId)
    if (!service) return undefined
    return service.envs.find(e => e.key === key)?.value
}

export function getServiceMode(serviceId: string): EnvMode {
    const service = getServiceEnvs(serviceId)
    return service?.mode ?? "cloud_only"
}

export function clearAll(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
}
