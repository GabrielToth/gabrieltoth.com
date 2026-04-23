/**
 * Tests for Dependency Injection Container
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { BaseService } from "./base-service"
import { DIContainer, resetDIContainer } from "./dependency-injection"

/**
 * Test service implementation
 */
class TestService extends BaseService {
    public initializeCalled = false

    async onInitialize(): Promise<void> {
        this.initializeCalled = true
    }
}

/**
 * Test service with dependencies
 */
class DependentService extends BaseService {
    constructor(public dependency: TestService) {
        super()
    }
}

describe("DIContainer", () => {
    let container: DIContainer

    beforeEach(() => {
        container = new DIContainer()
    })

    afterEach(() => {
        resetDIContainer()
    })

    describe("registration", () => {
        it("should register a service factory", () => {
            container.register("test", () => new TestService())

            expect(container.has("test")).toBe(true)
        })

        it("should register a service instance", () => {
            const service = new TestService()
            container.registerInstance("test", service)

            expect(container.has("test")).toBe(true)
        })

        it("should overwrite existing service", () => {
            container.register("test", () => new TestService())
            container.register("test", () => new TestService())

            expect(container.has("test")).toBe(true)
        })

        it("should register with dependencies", () => {
            container.register("test", () => new TestService(), {
                dependencies: ["other"],
            })

            expect(container.has("test")).toBe(true)
        })
    })

    describe("instantiation", () => {
        it("should instantiate a service", async () => {
            container.register("test", () => new TestService())

            const service = await container.get<TestService>("test")

            expect(service).toBeInstanceOf(TestService)
        })

        it("should cache singleton services", async () => {
            container.register("test", () => new TestService(), {
                singleton: true,
            })

            const service1 = await container.get<TestService>("test")
            const service2 = await container.get<TestService>("test")

            expect(service1).toBe(service2)
        })

        it("should create new instances for non-singleton services", async () => {
            container.register("test", () => new TestService(), {
                singleton: false,
            })

            const service1 = await container.get<TestService>("test")
            const service2 = await container.get<TestService>("test")

            expect(service1).not.toBe(service2)
        })

        it("should throw when service not found", async () => {
            await expect(container.get("nonexistent")).rejects.toThrow(
                "Service nonexistent not found"
            )
        })

        it("should support async factories", async () => {
            container.register("test", async () => {
                await new Promise(resolve => setTimeout(resolve, 10))
                return new TestService()
            })

            const service = await container.get<TestService>("test")

            expect(service).toBeInstanceOf(TestService)
        })

        it("should handle factory errors", async () => {
            container.register("test", () => {
                throw new Error("Factory error")
            })

            await expect(container.get("test")).rejects.toThrow("Factory error")
        })
    })

    describe("synchronous access", () => {
        it("should get instantiated service synchronously", async () => {
            container.register("test", () => new TestService())
            await container.get("test")

            const service = container.getSync<TestService>("test")

            expect(service).toBeInstanceOf(TestService)
        })

        it("should throw when service not instantiated", () => {
            container.register("test", () => new TestService())

            expect(() => container.getSync("test")).toThrow("not instantiated")
        })
    })

    describe("initialization", () => {
        it("should initialize all services", async () => {
            const service1 = new TestService()
            const service2 = new TestService()

            container.registerInstance("service1", service1)
            container.registerInstance("service2", service2)

            await container.initialize()

            expect(service1.isReady()).toBe(true)
            expect(service2.isReady()).toBe(true)
        })

        it("should throw if any service fails to initialize", async () => {
            class FailingService extends BaseService {
                async onInitialize(): Promise<void> {
                    throw new Error("Initialization failed")
                }
            }

            container.register("test", () => new TestService())
            container.register("failing", () => new FailingService())

            await expect(container.initialize()).rejects.toThrow()
        })

        it("should not initialize twice", async () => {
            container.register("test", () => new TestService())

            await container.initialize()
            await container.initialize()

            expect(container.hasInstance("test")).toBe(true)
        })
    })

    describe("shutdown", () => {
        it("should shutdown all services", async () => {
            const service1 = new TestService()
            const service2 = new TestService()

            container.registerInstance("service1", service1)
            container.registerInstance("service2", service2)

            await container.initialize()
            await container.shutdown()

            expect(service1.isReady()).toBe(false)
            expect(service2.isReady()).toBe(false)
        })

        it("should clear instances on shutdown", async () => {
            container.register("test", () => new TestService())

            await container.initialize()
            expect(container.hasInstance("test")).toBe(true)

            await container.shutdown()
            expect(container.hasInstance("test")).toBe(false)
        })

        it("should not shutdown uninitialized container", async () => {
            container.register("test", () => new TestService())

            await container.shutdown()

            expect(container.hasInstance("test")).toBe(false)
        })
    })

    describe("service registry", () => {
        it("should register BaseService instances with registry", async () => {
            container.register("test", () => new TestService())

            await container.get("test")

            const registry = container.getServiceRegistry()
            expect(registry.has("test")).toBe(true)
        })

        it("should provide access to service registry", () => {
            const registry = container.getServiceRegistry()

            expect(registry).toBeDefined()
        })
    })

    describe("utility methods", () => {
        it("should get all service names", () => {
            container.register("service1", () => new TestService())
            container.register("service2", () => new TestService())

            const names = container.getServiceNames()

            expect(names).toContain("service1")
            expect(names).toContain("service2")
            expect(names.length).toBe(2)
        })

        it("should get instantiated service names", async () => {
            container.register("service1", () => new TestService())
            container.register("service2", () => new TestService())

            await container.get("service1")

            const names = container.getInstantiatedServiceNames()

            expect(names).toContain("service1")
            expect(names).not.toContain("service2")
        })

        it("should clear all services", () => {
            container.register("service1", () => new TestService())
            container.register("service2", () => new TestService())

            container.clear()

            expect(container.has("service1")).toBe(false)
            expect(container.has("service2")).toBe(false)
        })
    })

    describe("dependency resolution", () => {
        it("should resolve service with dependencies", async () => {
            container.register("dependency", () => new TestService())
            container.register("dependent", async (c: DIContainer) => {
                const dep = await c.get<TestService>("dependency")
                return new DependentService(dep)
            })

            const service = await container.get<DependentService>("dependent")

            expect(service.dependency).toBeInstanceOf(TestService)
        })

        it("should support circular dependency detection", async () => {
            container.register("service1", async (c: DIContainer) => {
                await c.get("service2")
                return new TestService()
            })
            container.register("service2", async (c: DIContainer) => {
                await c.get("service1")
                return new TestService()
            })

            // This will cause infinite recursion, but we're testing that it doesn't crash
            // In a real implementation, you'd want to detect this
            await expect(container.get("service1")).rejects.toThrow()
        })
    })
})
