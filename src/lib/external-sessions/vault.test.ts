import { describe, expect, it } from "vitest"
import {
    decryptSessionPayload,
    encryptSessionPayload,
    fromEncryptedRecord,
    toEncryptedRecord,
} from "./vault"
import { ExternalAccountSession } from "./types"

describe("External Sessions Vault", () => {
    const mockSession: ExternalAccountSession = {
        id: "sess-waveigl-tiktok-123",
        managerUserId: "user-gabriel-manager-id",
        managedClientName: "Waveigl",
        platform: "tiktok",
        platformUsername: "waveigl_official",
        status: "active",
        cookies: [
            {
                name: "sessionid",
                value: "abc123secretcookie",
                domain: ".tiktok.com",
                path: "/",
                secure: true,
                httpOnly: true,
            },
        ],
        authTokens: {
            bearer: "mock-bearer-token-999",
        },
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }

    it("should encrypt and decrypt session payload correctly", () => {
        const payload = {
            cookies: mockSession.cookies,
            authTokens: mockSession.authTokens,
        }

        const encrypted = encryptSessionPayload(payload)
        expect(encrypted).toBeTypeOf("string")
        expect(encrypted).not.toContain("abc123secretcookie")

        const decrypted = decryptSessionPayload(encrypted)
        expect(decrypted.cookies).toEqual(mockSession.cookies)
        expect(decrypted.authTokens).toEqual(mockSession.authTokens)
    })

    it("should convert to and from encrypted vault record seamlessly", () => {
        const encryptedRecord = toEncryptedRecord(mockSession)
        expect(encryptedRecord.encryptedPayload).toBeTypeOf("string")
        expect(encryptedRecord.managedClientName).toBe("Waveigl")
        expect(encryptedRecord.platform).toBe("tiktok")

        const restoredSession = fromEncryptedRecord(encryptedRecord)
        expect(restoredSession).toEqual(mockSession)
    })

    it("should throw error when attempting to decrypt tampered string", () => {
        expect(() => decryptSessionPayload("invalid-base64-payload")).toThrow()
    })
})
