// Unit Tests for Cron Scheduler
// Feature: distributed-infrastructure-logging

import { beforeEach, describe, expect, it, vi } from "vitest"
import { DiscordAlerter } from "../discord/alerter"
import { MeteringSystem } from "../metering"
import { CronSchedulerImpl } from "./index"

// Mock node-cron
vi.mock("node-cron", () => ({
    default: {
        schedule: vi.fn((pattern, callback, options) => ({
            stop: vi.fn(),
            start: vi.fn(),
            callback,
            pattern,
            options,
        })),
    },
}))

describe("Cron Scheduler", () => {
    let cronScheduler: CronSchedulerImpl
    let mockMeteringSystem: MeteringSystem
    let mockDiscordAlerter: DiscordAlerter

    beforeEach(() => {
        mockMeteringSystem = {
            aggregateDaily: vi.fn().mockResolvedValue({
                usersProcessed: 10,
                totalCost: 100.5,
                errors: [],
            }),
        } as unknown as MeteringSystem

        mockDiscordAlerter = {
            sendAlert: vi.fn().mockResolvedValue(undefined),
        } as unknown as DiscordAlerter

        cronScheduler = new CronSchedulerImpl(
            mockMeteringSystem,
            mockDiscordAlerter
        )
    })

    it("should start cron scheduler", () => {
        cronScheduler.start()

        // Verify cron was scheduled
        expect(cronScheduler["task"]).toBeDefined()
    })

    it("should stop cron scheduler", () => {
        cronScheduler.start()
        const stopSpy = vi.spyOn(cronScheduler["task"]!, "stop")

        cronScheduler.stop()

        expect(stopSpy).toHaveBeenCalled()
        expect(cronScheduler["task"]).toBeNull()
    })

    it("should use correct cron expression (00:00 UTC)", () => {
        cronScheduler.start()

        const task = cronScheduler["task"]
        expect(task).toBeDefined()
        expect((task as any).pattern).toBe("0 0 * * *")
        expect((task as any).options.timezone).toBe("UTC")
    })

    it("should call aggregateDaily when triggered", async () => {
        cronScheduler.start()

        // Manually trigger the cron callback
        const task = cronScheduler["task"]
        await (task as any).callback()

        expect(mockMeteringSystem.aggregateDaily).toHaveBeenCalled()
    })

    it("should send Discord alert on aggregation errors", async () => {
        mockMeteringSystem.aggregateDaily = vi.fn().mockResolvedValue({
            usersProcessed: 10,
            totalCost: 100.5,
            errors: ["Error 1", "Error 2"],
        })

        cronScheduler.start()

        // Trigger the cron callback
        const task = cronScheduler["task"]
        await (task as any).callback()

        expect(mockDiscordAlerter.sendAlert).toHaveBeenCalledWith({
            level: "error",
            title: "Daily Aggregation Errors",
            message: expect.stringContaining("2 errors"),
            context: expect.objectContaining({
                usersProcessed: 10,
                totalCost: 100.5,
                errors: ["Error 1", "Error 2"],
            }),
        })
    })

    it("should send fatal alert on aggregation failure", async () => {
        const error = new Error("Aggregation failed")
        mockMeteringSystem.aggregateDaily = vi.fn().mockRejectedValue(error)

        cronScheduler.start()

        // Trigger the cron callback
        const task = cronScheduler["task"]
        await (task as any).callback()

        expect(mockDiscordAlerter.sendAlert).toHaveBeenCalledWith({
            level: "fatal",
            title: "Daily Aggregation Failed",
            message: "Daily aggregation job failed completely",
            context: {
                error: "Aggregation failed",
            },
            stack: error.stack,
        })
    })

    it("should not send alert when aggregation succeeds without errors", async () => {
        cronScheduler.start()

        // Trigger the cron callback
        const task = cronScheduler["task"]
        await (task as any).callback()

        expect(mockDiscordAlerter.sendAlert).not.toHaveBeenCalled()
    })

    it("should handle stop when not started", () => {
        expect(() => cronScheduler.stop()).not.toThrow()
    })

    it("should limit errors in Discord alert to 5", async () => {
        const manyErrors = Array.from(
            { length: 10 },
            (_, i) => `Error ${i + 1}`
        )
        mockMeteringSystem.aggregateDaily = vi.fn().mockResolvedValue({
            usersProcessed: 10,
            totalCost: 100.5,
            errors: manyErrors,
        })

        cronScheduler.start()

        // Trigger the cron callback
        const task = cronScheduler["task"]
        await (task as any).callback()

        expect(mockDiscordAlerter.sendAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                context: expect.objectContaining({
                    errors: manyErrors.slice(0, 5),
                }),
            })
        )
    })
})
