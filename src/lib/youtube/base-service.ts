/**
 * Base Service Class for YouTube Channel Linking
 * Provides common error handling, logging, and lifecycle management
 * Validates: Requirements 1.1
 */

import { createLogger } from "../logger"

/**
 * Service error with context and metadata
 */
export class ServiceError extends Error {
    constructor(
        public code: string,
        message: string,
        public statusCode: number = 500,
        public context?: Record<string, unknown>
    ) {
        super(message)
        this.name = "ServiceError"
    }
}

/**
 * Service lifecycle hooks
 */
export interface ServiceLifecycle {
    /**
     * Called when service is initialized
     */
    onInitialize?(): Promise<void>

    /**
     * Called when service is shutting down
     */
    onShutdown?(): Promise<void>
}

/**
 * Base service class with common functionality
 */
export abstract class BaseService implements ServiceLifecycle {
    protected logger = createLogger(this.constructor.name)
    protected isInitialized = false
    protected isShuttingDown = false

    /**
     * Initialize the service
     * Calls onInitialize hook if implemented
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.logger.warn("Service already initialized")
            return
        }

        try {
            this.logger.info("Initializing service")

            if (this.onInitialize) {
                await this.onInitialize()
            }

            this.isInitialized = true
            this.logger.info("Service initialized successfully")
        } catch (error) {
            this.logger.error(
                "Failed to initialize service",
                error instanceof Error ? error : new Error(String(error))
            )
            throw error
        }
    }

    /**
     * Shutdown the service
     * Calls onShutdown hook if implemented
     */
    async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            this.logger.warn("Service already shutting down")
            return
        }

        if (!this.isInitialized) {
            this.logger.warn("Service not initialized, skipping shutdown")
            return
        }

        try {
            this.isShuttingDown = true
            this.logger.info("Shutting down service")

            if (this.onShutdown) {
                await this.onShutdown()
            }

            this.isInitialized = false
            this.logger.info("Service shutdown successfully")
        } catch (error) {
            this.logger.error(
                "Error during service shutdown",
                error instanceof Error ? error : new Error(String(error))
            )
            throw error
        }
    }

    /**
     * Check if service is ready
     */
    isReady(): boolean {
        return this.isInitialized && !this.isShuttingDown
    }

    /**
     * Assert service is ready
     * @throws ServiceError if service is not ready
     */
    protected assertReady(): void {
        if (!this.isReady()) {
            throw new ServiceError(
                "SERVICE_NOT_READY",
                `${this.constructor.name} is not ready`,
                503
            )
        }
    }

    /**
     * Handle and log errors with context
     */
    protected handleError(
        error: unknown,
        context: string,
        metadata?: Record<string, unknown>
    ): ServiceError {
        const err = error instanceof Error ? error : new Error(String(error))

        this.logger.error(context, err, metadata)

        if (error instanceof ServiceError) {
            return error
        }

        return new ServiceError("INTERNAL_ERROR", err.message, 500, metadata)
    }

    /**
     * Lifecycle hook - override in subclasses
     */
    async onInitialize?(): Promise<void>

    /**
     * Lifecycle hook - override in subclasses
     */
    async onShutdown?(): Promise<void>
}

/**
 * Service registry for tracking all services
 */
export class ServiceRegistry {
    private services: Map<string, BaseService> = new Map()
    private logger = createLogger("ServiceRegistry")

    /**
     * Register a service
     */
    register(name: string, service: BaseService): void {
        if (this.services.has(name)) {
            this.logger.warn(`Service ${name} already registered, overwriting`)
        }

        this.services.set(name, service)
        this.logger.debug(`Service ${name} registered`)
    }

    /**
     * Get a registered service
     */
    get<T extends BaseService>(name: string): T {
        const service = this.services.get(name)

        if (!service) {
            throw new ServiceError(
                "SERVICE_NOT_FOUND",
                `Service ${name} not found in registry`,
                404
            )
        }

        return service as T
    }

    /**
     * Check if service is registered
     */
    has(name: string): boolean {
        return this.services.has(name)
    }

    /**
     * Initialize all registered services
     */
    async initializeAll(): Promise<void> {
        this.logger.info(`Initializing ${this.services.size} services`)

        for (const [name, service] of this.services) {
            try {
                await service.initialize()
            } catch (error) {
                this.logger.error(
                    `Failed to initialize service ${name}`,
                    error instanceof Error ? error : new Error(String(error))
                )
                throw error
            }
        }

        this.logger.info("All services initialized successfully")
    }

    /**
     * Shutdown all registered services in reverse order
     */
    async shutdownAll(): Promise<void> {
        this.logger.info(`Shutting down ${this.services.size} services`)

        const services = Array.from(this.services.entries()).reverse()

        for (const [name, service] of services) {
            try {
                await service.shutdown()
            } catch (error) {
                this.logger.error(
                    `Error shutting down service ${name}`,
                    error instanceof Error ? error : new Error(String(error))
                )
            }
        }

        this.logger.info("All services shutdown successfully")
    }

    /**
     * Get all registered services
     */
    getAll(): Map<string, BaseService> {
        return new Map(this.services)
    }

    /**
     * Clear all services
     */
    clear(): void {
        this.services.clear()
        this.logger.debug("Service registry cleared")
    }
}

/**
 * Create a singleton service registry
 */
let registryInstance: ServiceRegistry | null = null

/**
 * Get or create the service registry
 */
export function getServiceRegistry(): ServiceRegistry {
    if (!registryInstance) {
        registryInstance = new ServiceRegistry()
    }
    return registryInstance
}
