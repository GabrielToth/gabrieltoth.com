"use client"

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react"
import type { EnvMode, ServiceEnvs } from "./types"
import { KNOWN_SERVICES } from "./types"
import {
    getAllServiceEnvs,
    setServiceMode as storageSetMode,
    setEnvVar as storageSetEnv,
    removeEnvVar as storageRemoveEnv,
    removeService as storageRemoveService,
    clearAll as storageClearAll,
} from "./storage"

interface LocalEnvsContextValue {
    services: ServiceEnvs[]
    definedServices: ServiceEnvs[]
    isLoaded: boolean
    setMode: (serviceId: string, mode: EnvMode) => void
    setEnv: (serviceId: string, key: string, value: string, label: string) => void
    removeEnv: (serviceId: string, key: string) => void
    removeService: (serviceId: string) => void
    clearAll: () => void
    getEnv: (serviceId: string, key: string) => string | undefined
    getMode: (serviceId: string) => EnvMode
}

const LocalEnvsContext = createContext<LocalEnvsContextValue | null>(null)

export function LocalEnvsProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const [services, setServices] = useState<ServiceEnvs[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    const refresh = useCallback(() => {
        setServices(getAllServiceEnvs())
        setIsLoaded(true)
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const definedServices = KNOWN_SERVICES.map(def => {
        const stored = services.find(s => s.serviceId === def.id)
        return (
            stored ?? {
                serviceId: def.id,
                serviceName: def.name,
                icon: def.icon,
                mode: "cloud_only" as EnvMode,
                envs: [],
            }
        )
    })

    const setMode = useCallback(
        (serviceId: string, mode: EnvMode) => {
            storageSetMode(serviceId, mode)
            refresh()
        },
        [refresh]
    )

    const setEnv = useCallback(
        (
            serviceId: string,
            key: string,
            value: string,
            label: string
        ) => {
            storageSetEnv(serviceId, key, value, label)
            refresh()
        },
        [refresh]
    )

    const removeEnv = useCallback(
        (serviceId: string, key: string) => {
            storageRemoveEnv(serviceId, key)
            refresh()
        },
        [refresh]
    )

    const removeService = useCallback(
        (serviceId: string) => {
            storageRemoveService(serviceId)
            refresh()
        },
        [refresh]
    )

    const clearAll = useCallback(() => {
        storageClearAll()
        refresh()
    }, [refresh])

    const getEnv = useCallback(
        (serviceId: string, key: string): string | undefined => {
            const service = services.find(s => s.serviceId === serviceId)
            return service?.envs.find(e => e.key === key)?.value
        },
        [services]
    )

    const getMode = useCallback(
        (serviceId: string): EnvMode => {
            const service = services.find(s => s.serviceId === serviceId)
            return service?.mode ?? "cloud_only"
        },
        [services]
    )

    return (
        <LocalEnvsContext.Provider
            value={{
                services,
                definedServices,
                isLoaded,
                setMode,
                setEnv,
                removeEnv,
                removeService,
                clearAll,
                getEnv,
                getMode,
            }}
        >
            {children}
        </LocalEnvsContext.Provider>
    )
}

export function useLocalEnvs(): LocalEnvsContextValue {
    const ctx = useContext(LocalEnvsContext)
    if (!ctx) {
        throw new Error("useLocalEnvs must be used within <LocalEnvsProvider>")
    }
    return ctx
}
