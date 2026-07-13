/**
 * Session Module Barrel Test
 * Verifies that all exports from the barrel re-export are correctly exposed.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import { describe, expect, it } from "vitest"
import * as sessionExports from "./session"

describe("Session Module Barrel", () => {
    it("should export all session management functions", () => {
        expect(sessionExports.createSession).toBeDefined()
        expect(typeof sessionExports.createSession).toBe("function")
        expect(sessionExports.validateSession).toBeDefined()
        expect(typeof sessionExports.validateSession).toBe("function")
        expect(sessionExports.removeSession).toBeDefined()
        expect(typeof sessionExports.removeSession).toBe("function")
        expect(sessionExports.getSessionFromCookie).toBeDefined()
        expect(typeof sessionExports.getSessionFromCookie).toBe("function")
        expect(sessionExports.setAuthSessionCookie).toBeDefined()
        expect(typeof sessionExports.setAuthSessionCookie).toBe("function")
    })

    it("should export all session token functions", () => {
        expect(sessionExports.generateSessionToken).toBeDefined()
        expect(typeof sessionExports.generateSessionToken).toBe("function")
        expect(sessionExports.generateRememberMeToken).toBeDefined()
        expect(typeof sessionExports.generateRememberMeToken).toBe("function")
        expect(sessionExports.validateSessionToken).toBeDefined()
        expect(typeof sessionExports.validateSessionToken).toBe("function")
        expect(sessionExports.validateRememberMeToken).toBeDefined()
        expect(typeof sessionExports.validateRememberMeToken).toBe("function")
        expect(sessionExports.refreshSessionToken).toBeDefined()
        expect(typeof sessionExports.refreshSessionToken).toBe("function")
        expect(sessionExports.storeSessionToken).toBeDefined()
        expect(typeof sessionExports.storeSessionToken).toBe("function")
    })

    it("should export all remember-me functions", () => {
        expect(sessionExports.createRememberMeToken).toBeDefined()
        expect(typeof sessionExports.createRememberMeToken).toBe("function")
        expect(sessionExports.getRememberMeToken).toBeDefined()
        expect(typeof sessionExports.getRememberMeToken).toBe("function")
        expect(sessionExports.deleteRememberMeToken).toBeDefined()
        expect(typeof sessionExports.deleteRememberMeToken).toBe("function")
        expect(sessionExports.storeRememberMeToken).toBeDefined()
        expect(typeof sessionExports.storeRememberMeToken).toBe("function")
    })

    it("should export all constants", () => {
        expect(sessionExports.SESSION_EXPIRATION_DAYS).toBeDefined()
        expect(sessionExports.SESSION_ID_LENGTH).toBeDefined()
        expect(sessionExports.TOKEN_LENGTH).toBeDefined()
        expect(sessionExports.SESSION_COOKIE_OPTIONS).toBeDefined()
        expect(sessionExports.SESSION_TOKEN_EXPIRATION_HOURS).toBeDefined()
        expect(sessionExports.REMEMBER_ME_COOKIE_OPTIONS).toBeDefined()
        expect(sessionExports.REMEMBER_ME_TOKEN_EXPIRATION_DAYS).toBeDefined()
    })

    it("should export the expected total count of items", () => {
        const exportNames = Object.keys(sessionExports)
        // 15 functions + 7 constants = 22 total exports
        expect(exportNames.length).toBe(22)
    })
})
