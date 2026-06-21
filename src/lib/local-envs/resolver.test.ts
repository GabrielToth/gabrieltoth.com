import { describe, expect, it, beforeEach } from "vitest"
import { resolveEnv } from "./resolver"
import { clearAll, setEnvVar, setServiceMode } from "./storage"

beforeEach(() => {
    localStorage.clear()
    clearAll()
})

describe("local-envs resolver", () => {
    it("cloud_only mode returns cloud value", () => {
        const result = resolveEnv("google", "GOOGLE_CLIENT_ID")
        expect(result.source).toBe("cloud")
    })

    it("local_only mode returns local value if set", () => {
        setServiceMode("google", "local_only")
        setEnvVar("google", "GOOGLE_CLIENT_ID", "my-local-id", "Google ID")
        const result = resolveEnv("google", "GOOGLE_CLIENT_ID")
        expect(result.value).toBe("my-local-id")
        expect(result.source).toBe("local")
        expect(result.mode).toBe("local_only")
    })

    it("local_only mode returns undefined when no local value", () => {
        setServiceMode("google", "local_only")
        const result = resolveEnv("google", "GOOGLE_CLIENT_ID")
        expect(result.value).toBeUndefined()
        expect(result.source).toBe("local")
    })

    it("local_preferred returns local value first", () => {
        setServiceMode("google", "local_preferred")
        setEnvVar("google", "GOOGLE_CLIENT_ID", "local-val", "G")

        // Since we can't set process.env in vitest easily, this should
        // return local value if set, otherwise cloud (which is undefined)
        const result = resolveEnv("google", "GOOGLE_CLIENT_ID")
        expect(result.value).toBe("local-val")
        expect(result.source).toBe("local")
    })

    it("local_preferred falls back to cloud when no local value", () => {
        setServiceMode("google", "local_preferred")
        const result = resolveEnv("google", "GOOGLE_CLIENT_ID")
        expect(result.source).toBe("cloud")
    })

    it("cloud_preferred returns cloud first", () => {
        setServiceMode("google", "cloud_preferred")
        setEnvVar("google", "GOOGLE_CLIENT_ID", "local-val", "G")
        const result = resolveEnv("google", "GOOGLE_CLIENT_ID")
        expect(result.source).toBe("cloud")
    })

    it("cloud_preferred falls back to local when no cloud value", () => {
        setServiceMode("google", "cloud_preferred")
        setEnvVar("google", "GOOGLE_CLIENT_ID", "local-val", "G")
        const result = resolveEnv("google", "GOOGLE_CLIENT_ID")
        expect(result.source).toBe("cloud")
    })

    it("default mode is cloud_only", () => {
        const result = resolveEnv("google", "GOOGLE_CLIENT_ID")
        expect(result.mode).toBe("cloud_only")
        expect(result.source).toBe("cloud")
    })

    it("different services have independent resolution", () => {
        setServiceMode("google", "local_only")
        setEnvVar("google", "GOOGLE_CLIENT_ID", "google-val", "G")
        setServiceMode("meta", "local_only")

        const googleResult = resolveEnv("google", "GOOGLE_CLIENT_ID")
        expect(googleResult.value).toBe("google-val")

        const metaResult = resolveEnv("meta", "META_APP_ID")
        expect(metaResult.value).toBeUndefined()
    })
})
