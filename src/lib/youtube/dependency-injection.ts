/**
 * Dependency Injection Container for YouTube Channel Linking Services
 * Manages service instantiation, lifecycle, and dependencies
 * Validates: Requirements 1.1
 */

import { createLogger } from "../logger"
import { BaseService, ServiceRegistry } from "./base-service"

/**
 * Service factory function
 */
export type ServiceFactory<T> = (container: DIContainer) => T | Promise<T>

/**
 * Service definition
 */
interface ServiceDefinition<T = unknown> {
    factory: ServiceFactory<T>
    singleton: boolean
    instance?: T
    dependencies?: string[]
}

/**
 * Dependency Injection Container
 * Manages service registration, instantiation, and lifecycle
 */
export class DIContainer {
    private definitions: Map<string, ServiceDefinition> = new Map()
    private instances: Map<string, unknown> = new Map()
    private logger = createLogger("DIContainer")
    private serviceRegistry: ServiceRegistry
    private isInitialized = false
    private isShuttingDown = false

    constructor() {
        this.serviceRegistry = new ServiceRegistry()
    }

    /**
     * Register a service factory
     * @param name - Service name
     * @param factory - Factory function to create the service
     * @param options - Registration options
     */
    register<T>(
        name: string,
        factory: ServiceFactory<T>,
        options?: {
            singleton?: boolean
            dependencies?: string[]
        }
    ): this {
        if (this.definitions.has(name)) {
            this.logger.warn(`Service ${name} already registered, overwriting`)
        }

        this.definitions.set(name, {
            factory,
            singleton: options?.singleton ?? true,
            dependencies: options?.dependencies,
        })

        this.logger.debug(`Service ${name} registered`)
        return this
    }

    /**
     * Register a singleton service instance
     * @param name - Service name
     * @param instance - Service instance
     */
    registerInstance<T>(name: string, instance: T): this {
        if (this.definitions.has(name)) {
            this.logger.warn(`Service ${name} already registered, overwriting`)
        }

        this.definitions.set(name, {
            factory: () => instance,
            singleton: true,
            instance,
        })

        this.instances.set(name, instance)

        // Register with service registry if it's a BaseService
        if (instance instanceof BaseService) {
            this.serviceRegistry.register(name, instance)
        }

        this.logger.debug(`Service instance ${name} registered`)
        return this
    }

    /**
     * Get a service instance
     * @param name - Service name
     * @returns Service instance
     * @throws Error if service not found or instantiation fails
     */
    async get<T = unknown>(name: string): Promise<T> {
        // Check if already instantiated (singleton)
        if (this.instances.has(name)) {
            return this.instances.get(name) as T
        }

        const definition = this.definitions.get(name)

        if (!definition) {
            throw new Error(`Service ${name} not found in container`)
        }

        try {
            // Instantiate the service
            const instance = await definition.factory(this)

            // Cache if singleton
            if (definition.singleton) {
                this.instances.set(name, instance)
            }

            // Register with service registry if it's a BaseService
            if (instance instanceof BaseService) {
                this.serviceRegistry.register(name, instance)
            }

            return instance as T
        } catch (error) {
            this.logger.error(
                `Failed to instantiate service ${name}`,
                error instanceof Error ? error : new Error(String(error))
            )
            throw error
        }
    }

    /**
     * Get a service synchronously (must be already instantiated)
     * @param name - Service name
     * @returns Service instance
     * @throws Error if service not found or not instantiated
     */
    getSync<T = unknown>(name: string): T {
        if (!this.instances.has(name)) {
            throw new Error(
                `Service ${name} not found or not instantiated. Use get() for async instantiation.`
            )
        }

        return this.instances.get(name) as T
    }

    /**
     * Check if service is registered
     */
    has(name: string): boolean {
        return this.definitions.has(name)
    }

    /**
     * Check if service is instantiated
     */
    hasInstance(name: string): boolean {
        return this.instances.has(name)
    }

    /**
     * Initialize all registered services
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.logger.warn("Container already initialized")
            return
        }

        try {
            this.logger.info("Initializing DI container")

            // Instantiate all services
            for (const name of this.definitions.keys()) {
                await this.get(name)
            }

            // Initialize all BaseService instances
            await this.serviceRegistry.initializeAll()

            this.isInitialized = true
            this.logger.info("DI container initialized successfully")
        } catch (error) {
            this.logger.error(
                "Failed to initialize DI container",
                error instanceof Error ? error : new Error(String(error))
            )
            throw error
        }
    }

    /**
     * Shutdown all services
     */
    async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            this.logger.warn("Container already shutting down")
            return
        }

        if (!this.isInitialized) {
            this.logger.warn("Container not initialized, skipping shutdown")
            return
        }

        try {
            this.isShuttingDown = true
            this.logger.info("Shutting down DI container")

            // Shutdown all services
            await this.serviceRegistry.shutdownAll()

            // Clear instances
            this.instances.clear()

            this.isInitialized = false
            this.logger.info("DI container shutdown successfully")
        } catch (error) {
            this.logger.error(
                "Error during DI container shutdown",
                error instanceof Error ? error : new Error(String(error))
            )
            throw error
        }
    }

    /**
     * Get the service registry
     */
    getServiceRegistry(): ServiceRegistry {
        return this.serviceRegistry
    }

    /**
     * Clear all services and instances
     */
    clear(): void {
        this.definitions.clear()
        this.instances.clear()
        this.serviceRegistry.clear()
        this.logger.debug("DI container cleared")
    }

    /**
     * Get all registered service names
     */
    getServiceNames(): string[] {
        return Array.from(this.definitions.keys())
    }

    /**
     * Get all instantiated service names
     */
    getInstantiatedServiceNames(): string[] {
        return Array.from(this.instances.keys())
    }
}

/**
 * Create a singleton DI container
 */
let containerInstance: DIContainer | null = null

/**
 * Get or create the DI container
 */
export function getDIContainer(): DIContainer {
    if (!containerInstance) {
        containerInstance = new DIContainer()
    }
    return containerInstance
}

/**
 * Reset the DI container (useful for testing)
 */
export function resetDIContainer(): void {
    if (containerInstance) {
        containerInstance.clear()
    }
    containerInstance = null
}
