import { describe, expect, it, beforeEach } from "vitest"
import {
    clearAll,
    getAllServiceEnvs,
    getEnvVarValue,
    getServiceMode,
    removeEnvVar,
    setEnvVar,
    setServiceMode,
} from "./storage"
import { STORAGE_KEY } from "./types"

beforeEach(() => {
    localStorage.clear()
})

describe("local-envs storage", () => {
    it("returns empty array when nothing stored", () => {
        expect(getAllServiceEnvs()).toEqual([])
    })

    it("returns cloud_only as default mode", () => {
        expect(getServiceMode("google")).toBe("cloud_only")
    })

    it("stores and retrieves env var value", () => {
        setEnvVar("google", "GOOGLE_CLIENT_ID", "my-id", "Google Client ID")
        expect(getEnvVarValue("google", "GOOGLE_CLIENT_ID")).toBe("my-id")
    })

    it("returns undefined for non-existent service", () => {
        expect(getEnvVarValue("nonexistent", "ANY_KEY")).toBeUndefined()
    })

    it("overwrites existing env var value", () => {
        setEnvVar("google", "GOOGLE_CLIENT_ID", "old", "Google Client ID")
        setEnvVar("google", "GOOGLE_CLIENT_ID", "new", "Google Client ID")
        expect(getEnvVarValue("google", "GOOGLE_CLIENT_ID")).toBe("new")
    })

    it("removes env var", () => {
        setEnvVar("google", "GOOGLE_CLIENT_ID", "my-id", "Google Client ID")
        removeEnvVar("google", "GOOGLE_CLIENT_ID")
        expect(getEnvVarValue("google", "GOOGLE_CLIENT_ID")).toBeUndefined()
    })

    it("sets and gets service mode", () => {
        setServiceMode("google", "local_only")
        expect(getServiceMode("google")).toBe("local_only")

        setServiceMode("google", "local_preferred")
        expect(getServiceMode("google")).toBe("local_preferred")

        setServiceMode("google", "cloud_only")
        expect(getServiceMode("google")).toBe("cloud_only")
    })

    it("clears all data", () => {
        setEnvVar("google", "GOOGLE_CLIENT_ID", "my-id", "Google Client ID")
        setServiceMode("meta", "local_only")
        clearAll()
        expect(getAllServiceEnvs()).toEqual([])
        expect(getServiceMode("google")).toBe("cloud_only")
    })

    it("stores different envs for different services", () => {
        setEnvVar("google", "GOOGLE_CLIENT_ID", "google-id", "Google ID")
        setEnvVar("meta", "META_APP_ID", "meta-id", "Meta ID")
        expect(getEnvVarValue("google", "GOOGLE_CLIENT_ID")).toBe("google-id")
        expect(getEnvVarValue("meta", "META_APP_ID")).toBe("meta-id")
        expect(getEnvVarValue("google", "META_APP_ID")).toBeUndefined()
    })

    it("persists data in localStorage", () => {
        setEnvVar("google", "GOOGLE_CLIENT_ID", "my-id", "Google Client ID")
        const raw = localStorage.getItem(STORAGE_KEY)
        expect(raw).not.toBeNull()
        const parsed = JSON.parse(raw!)
        expect(parsed.services).toHaveLength(1)
        expect(parsed.services[0].envs[0].value).toBe("my-id")
    })

    it("returns all service envs", () => {
        setEnvVar("google", "GOOGLE_CLIENT_ID", "g-id", "G")
        setEnvVar("meta", "META_APP_ID", "m-id", "M")
        const all = getAllServiceEnvs()
        expect(all).toHaveLength(2)
    })

    it("create service via setServiceMode", () => {
        setServiceMode("tiktok", "local_preferred")
        expect(getServiceMode("tiktok")).toBe("local_preferred")
    })

    it("service created via setServiceMode has empty envs", () => {
        setServiceMode("tiktok", "local_preferred")
        const all = getAllServiceEnvs()
        const svc = all.find(s => s.serviceId === "tiktok")
        expect(svc?.envs).toEqual([])
    })
})
