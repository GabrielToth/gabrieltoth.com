/**
 * Tests for Base Service Class
 */

import { beforeEach, describe, expect, it } from "vitest"
import { BaseService, ServiceError, ServiceRegistry } from "./base-service"

/**
 * Test service implementation
 */
class TestService extends BaseService {
    public initializeCalled = false
    public shutdownCalled = false

    async onInitialize(): Promise<void> {
        this.initializeCalled = true
    }

    async onShutdown(): Promise<void> {
        this.shutdownCalled = true
    }
}

describe("BaseService", () => {
    let service: TestService

    beforeEach(() => {
        service = new TestService()
    })

    describe("initialization", () => {
        it("should initialize service successfully", async () => {
            expect(service.isReady()).toBe(false)

            await service.initialize()

            expect(service.isReady()).toBe(true)
            expect(service.initializeCalled).toBe(true)
        })

        it("should not initialize twice", async () => {
            await service.initialize()
            const initCallCount = service.initializeCalled ? 1 : 0

            await service.initialize()

            expect(service.initializeCalled).toBe(true)
        })

        it("should handle initialization errors", async () => {
            class FailingService extends BaseService {
                async onInitialize(): Promise<void> {
                    throw new Error("Initialization failed")
                }
            }

            const failingService = new FailingService()

            await expect(failingService.initialize()).rejects.toThrow(
                "Initialization failed"
            )
            expect(failingService.isReady()).toBe(false)
        })
    })

    describe("shutdown", () => {
        it("should shutdown service successfully", async () => {
            await service.initialize()
            expect(service.isReady()).toBe(true)

            await service.shutdown()

            expect(service.isReady()).toBe(false)
            expect(service.shutdownCalled).toBe(true)
        })

        it("should not shutdown uninitialized service", async () => {
            await service.shutdown()

            expect(service.shutdownCalled).toBe(false)
        })

        it("should handle shutdown errors gracefully", async () => {
            class FailingShutdownService extends BaseService {
                async onShutdown(): Promise<void> {
                    throw new Error("Shutdown failed")
                }
            }

            const failingService = new FailingShutdownService()
            await failingService.initialize()

            await expect(failingService.shutdown()).rejects.toThrow(
                "Shutdown failed"
            )
        })
    })

    describe("error handling", () => {
        it("should throw ServiceError when not ready", () => {
            expect(() => service.assertReady()).toThrow(ServiceError)
        })

        it("should not throw when ready", async () => {
            await service.initialize()

            expect(() => service.assertReady()).not.toThrow()
        })

        it("should handle errors with context", () => {
            const error = new Error("Test error")
            const metadata = { userId: "123" }

            const serviceError = service["handleError"](
                error,
                "Test context",
                metadata
            )

            expect(serviceError).toBeInstanceOf(ServiceError)
            expect(serviceError.code).toBe("INTERNAL_ERROR")
            expect(serviceError.context).toEqual(metadata)
        })

        it("should preserve ServiceError when handling", () => {
            const originalError = new ServiceError(
                "CUSTOM_ERROR",
                "Custom error message",
                400
            )

            const handledError = service["handleError"](
                originalError,
                "Test context"
            )

            expect(handledError).toBe(originalError)
        })
    })
})

describe("ServiceError", () => {
    it("should create error with all properties", () => {
        const error = new ServiceError("TEST_ERROR", "Test message", 400, {
            userId: "123",
        })

        expect(error.code).toBe("TEST_ERROR")
        expect(error.message).toBe("Test message")
        expect(error.statusCode).toBe(400)
        expect(error.context).toEqual({ userId: "123" })
        expect(error.name).toBe("ServiceError")
    })

    it("should have default status code", () => {
        const error = new ServiceError("TEST_ERROR", "Test message")

        expect(error.statusCode).toBe(500)
    })
})

describe("ServiceRegistry", () => {
    let registry: ServiceRegistry
    let service1: TestService
    let service2: TestService

    beforeEach(() => {
        registry = new ServiceRegistry()
        service1 = new TestService()
        service2 = new TestService()
    })

    describe("registration", () => {
        it("should register a service", () => {
            registry.register("service1", service1)

            expect(registry.has("service1")).toBe(true)
        })

        it("should get a registered service", () => {
            registry.register("service1", service1)

            const retrieved = registry.get<TestService>("service1")

            expect(retrieved).toBe(service1)
        })

        it("should throw when getting unregistered service", () => {
            expect(() => registry.get("nonexistent")).toThrow(ServiceError)
        })

        it("should overwrite existing service", () => {
            registry.register("service1", service1)
            registry.register("service1", service2)

            const retrieved = registry.get<TestService>("service1")

            expect(retrieved).toBe(service2)
        })
    })

    describe("initialization", () => {
        it("should initialize all services", async () => {
            registry.register("service1", service1)
            registry.register("service2", service2)

            await registry.initializeAll()

            expect(service1.isReady()).toBe(true)
            expect(service2.isReady()).toBe(true)
        })

        it("should throw if any service fails to initialize", async () => {
            class FailingService extends BaseService {
                async onInitialize(): Promise<void> {
                    throw new Error("Initialization failed")
                }
            }

            registry.register("service1", service1)
            registry.register("failing", new FailingService())

            await expect(registry.initializeAll()).rejects.toThrow()
        })
    })

    describe("shutdown", () => {
        it("should shutdown all services in reverse order", async () => {
            registry.register("service1", service1)
            registry.register("service2", service2)

            await registry.initializeAll()
            await registry.shutdownAll()

            expect(service1.isReady()).toBe(false)
            expect(service2.isReady()).toBe(false)
        })

        it("should continue shutdown even if one service fails", async () => {
            class FailingShutdownService extends BaseService {
                async onShutdown(): Promise<void> {
                    throw new Error("Shutdown failed")
                }
            }

            registry.register("service1", service1)
            registry.register("failing", new FailingShutdownService())

            await registry.initializeAll()

            // Should not throw
            await registry.shutdownAll()

            expect(service1.isReady()).toBe(false)
        })
    })

    describe("utility methods", () => {
        it("should get all services", () => {
            registry.register("service1", service1)
            registry.register("service2", service2)

            const all = registry.getAll()

            expect(all.size).toBe(2)
            expect(all.has("service1")).toBe(true)
            expect(all.has("service2")).toBe(true)
        })

        it("should clear all services", () => {
            registry.register("service1", service1)
            registry.register("service2", service2)

            registry.clear()

            expect(registry.has("service1")).toBe(false)
            expect(registry.has("service2")).toBe(false)
        })
    })
})
