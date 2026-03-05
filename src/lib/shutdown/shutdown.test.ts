// Unit Tests for Shutdown Handler
// Feature: distributed-infrastructure-logging

import { Redis } from "ioredis"
import { Pool } from "pg"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DiscordAlerter } from "../discord/alerter"
import { ShutdownHandlerImpl } from "./index"

describe("Shutdown Handler", () => {
    let shutdownHandler: ShutdownHandlerImpl
    let mockDbPool: Pool
    let mockRedisClient: Redis
    let mockDiscordAlerter: DiscordAlerter
    let processExitSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        // Create mocks
        mockDbPool = {
            end: vi.fn().mockResolvedValue(undefined),
        } as unknown as Pool

        mockRedisClient = {
            quit: vi.fn().mockResolvedValue("OK"),
        } as unknown as Redis

        mockDiscordAlerter = {
            sendAlert: vi.fn().mockResolvedValue(undefined),
        } as unknown as DiscordAlerter

        // Spy on process.exit
        processExitSpy = vi
            .spyOn(process, "exit")
            .mockImplementation((() => {}) as any)

        shutdownHandler = new ShutdownHandlerImpl(
            mockDbPool,
            mockRedisClient,
            mockDiscordAlerter
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("should register SIGTERM and SIGINT handlers", () => {
        const onSpy = vi.spyOn(process, "on")

        shutdownHandler.register()

        expect(onSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function))
        expect(onSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function))
    })

    it("should send Discord alert on shutdown", async () => {
        await shutdownHandler.shutdown("SIGTERM")

        expect(mockDiscordAlerter.sendAlert).toHaveBeenCalledWith({
            level: "shutdown",
            title: "Application Shutdown",
            message: "Application is shutting down (signal: SIGTERM)",
            context: expect.objectContaining({ signal: "SIGTERM" }),
        })
    })

    it("should close database pool", async () => {
        await shutdownHandler.shutdown("SIGTERM")

        expect(mockDbPool.end).toHaveBeenCalled()
    })

    it("should close Redis connection", async () => {
        await shutdownHandler.shutdown("SIGTERM")

        expect(mockRedisClient.quit).toHaveBeenCalled()
    })

    it("should exit with code 0 on successful shutdown", async () => {
        await shutdownHandler.shutdown("SIGTERM")

        expect(processExitSpy).toHaveBeenCalledWith(0)
    })

    it("should exit with code 1 on error", async () => {
        // Make database close fail
        mockDbPool.end = vi.fn().mockRejectedValue(new Error("DB error"))

        await shutdownHandler.shutdown("SIGTERM")

        expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it("should wait for pending operations", async () => {
        // Add pending operations
        shutdownHandler.incrementPending()
        shutdownHandler.incrementPending()

        expect(shutdownHandler.getPendingCount()).toBe(2)

        // Simulate operations completing after a delay
        setTimeout(() => {
            shutdownHandler.decrementPending()
            shutdownHandler.decrementPending()
        }, 50)

        await shutdownHandler.shutdown("SIGTERM")

        // Should have waited for operations
        expect(shutdownHandler.getPendingCount()).toBe(0)
    })

    it("should not shutdown twice", async () => {
        const firstShutdown = shutdownHandler.shutdown("SIGTERM")
        const secondShutdown = shutdownHandler.shutdown("SIGTERM")

        await Promise.all([firstShutdown, secondShutdown])

        // Database should only be closed once
        expect(mockDbPool.end).toHaveBeenCalledTimes(1)
    })

    it("should handle SIGINT signal", async () => {
        await shutdownHandler.shutdown("SIGINT")

        expect(mockDiscordAlerter.sendAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining("SIGINT"),
            })
        )
    })

    it("should track pending operations correctly", () => {
        expect(shutdownHandler.getPendingCount()).toBe(0)

        shutdownHandler.incrementPending()
        expect(shutdownHandler.getPendingCount()).toBe(1)

        shutdownHandler.incrementPending()
        expect(shutdownHandler.getPendingCount()).toBe(2)

        shutdownHandler.decrementPending()
        expect(shutdownHandler.getPendingCount()).toBe(1)

        shutdownHandler.decrementPending()
        expect(shutdownHandler.getPendingCount()).toBe(0)

        // Should not go negative
        shutdownHandler.decrementPending()
        expect(shutdownHandler.getPendingCount()).toBe(0)
    })
})
