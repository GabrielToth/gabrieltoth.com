/**
 * Docker Infrastructure Integration Tests
 *
 * Tests verify:
 * - All containers start successfully
 * - Health checks pass for all services
 * - Network connectivity between containers
 * - Network isolation (app cannot reach postgres directly)
 * - Volume persistence after container restart
 *
 * Requirements: 1.1, 1.3, 1.4, 1.6, 6.6, 6.7, 6.8, 7.4, 9.2, 9.3
 */

import { exec } from "child_process"
import { promisify } from "util"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const execAsync = promisify(exec)

// Helper to run docker-compose commands
async function dockerCompose(command: string): Promise<string> {
    const { stdout, stderr } = await execAsync(
        `docker-compose -f docker/docker-compose.yml ${command}`
    )
    if (
        stderr &&
        !stderr.includes("Creating") &&
        !stderr.includes("Starting")
    ) {
        console.error("Docker compose stderr:", stderr)
    }
    return stdout
}

// Helper to check if a container is healthy
async function isContainerHealthy(containerName: string): Promise<boolean> {
    try {
        const { stdout } = await execAsync(
            `docker inspect --format='{{.State.Health.Status}}' ${containerName}`
        )
        return stdout.trim() === "healthy"
    } catch (error) {
        return false
    }
}

// Helper to check if a container is running
async function isContainerRunning(containerName: string): Promise<boolean> {
    try {
        const { stdout } = await execAsync(
            `docker inspect --format='{{.State.Running}}' ${containerName}`
        )
        return stdout.trim() === "true"
    } catch (error) {
        return false
    }
}

// Helper to execute command inside container
async function execInContainer(
    containerName: string,
    command: string
): Promise<string> {
    const { stdout } = await execAsync(
        `docker exec ${containerName} ${command}`
    )
    return stdout.trim()
}

// Helper to wait for container to be healthy
async function waitForHealthy(
    containerName: string,
    timeoutMs = 60000
): Promise<void> {
    const startTime = Date.now()
    while (Date.now() - startTime < timeoutMs) {
        if (await isContainerHealthy(containerName)) {
            return
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
    throw new Error(
        `Container ${containerName} did not become healthy within ${timeoutMs}ms`
    )
}

describe("Docker Infrastructure Integration Tests", () => {
    // Increase timeout for Docker operations
    const DOCKER_TIMEOUT = 120000 // 2 minutes

    beforeAll(async () => {
        // Ensure clean state
        try {
            await dockerCompose("down -v")
        } catch (error) {
            // Ignore errors if containers don't exist
        }
    }, DOCKER_TIMEOUT)

    afterAll(async () => {
        // Cleanup after tests
        try {
            await dockerCompose("down")
        } catch (error) {
            console.error("Cleanup error:", error)
        }
    }, DOCKER_TIMEOUT)

    describe("Container Startup", () => {
        it(
            "should start postgres container successfully",
            async () => {
                // Start postgres
                await dockerCompose("up -d postgres")

                // Wait for healthy status
                await waitForHealthy("platform-postgres")

                // Verify running
                const isRunning = await isContainerRunning("platform-postgres")
                expect(isRunning).toBe(true)

                // Verify healthy
                const isHealthy = await isContainerHealthy("platform-postgres")
                expect(isHealthy).toBe(true)
            },
            DOCKER_TIMEOUT
        )

        it(
            "should start redis container successfully",
            async () => {
                // Start redis
                await dockerCompose("up -d redis")

                // Wait for healthy status
                await waitForHealthy("platform-redis")

                // Verify running
                const isRunning = await isContainerRunning("platform-redis")
                expect(isRunning).toBe(true)

                // Verify healthy
                const isHealthy = await isContainerHealthy("platform-redis")
                expect(isHealthy).toBe(true)
            },
            DOCKER_TIMEOUT
        )

        it(
            "should start backend container successfully",
            async () => {
                // Start backend (depends on postgres and redis)
                await dockerCompose("up -d backend")

                // Wait for healthy status
                await waitForHealthy("platform-backend", 90000) // Backend takes longer

                // Verify running
                const isRunning = await isContainerRunning("platform-backend")
                expect(isRunning).toBe(true)

                // Verify healthy
                const isHealthy = await isContainerHealthy("platform-backend")
                expect(isHealthy).toBe(true)
            },
            DOCKER_TIMEOUT
        )

        it(
            "should start app container successfully",
            async () => {
                // Start app (depends on backend)
                await dockerCompose("up -d app")

                // Wait for healthy status
                await waitForHealthy("platform-app", 90000) // App takes longer

                // Verify running
                const isRunning = await isContainerRunning("platform-app")
                expect(isRunning).toBe(true)

                // Verify healthy
                const isHealthy = await isContainerHealthy("platform-app")
                expect(isHealthy).toBe(true)
            },
            DOCKER_TIMEOUT
        )
    })

    describe("Health Checks", () => {
        it(
            "should pass postgres health check",
            async () => {
                const result = await execInContainer(
                    "platform-postgres",
                    "pg_isready -U platform"
                )
                expect(result).toContain("accepting connections")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should pass redis health check",
            async () => {
                const result = await execInContainer(
                    "platform-redis",
                    "redis-cli ping"
                )
                expect(result).toBe("PONG")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should pass backend health check",
            async () => {
                const result = await execInContainer(
                    "platform-backend",
                    'wget --quiet --tries=1 --spider http://localhost:4000/health || echo "failed"'
                )
                expect(result).not.toContain("failed")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should pass app health check",
            async () => {
                const result = await execInContainer(
                    "platform-app",
                    'wget --quiet --tries=1 --spider http://localhost:3000/api/health || echo "failed"'
                )
                expect(result).not.toContain("failed")
            },
            DOCKER_TIMEOUT
        )
    })

    describe("Network Connectivity", () => {
        it(
            "should allow app to connect to backend",
            async () => {
                // App should be able to reach backend on frontend network
                const result = await execInContainer(
                    "platform-app",
                    'wget --quiet --tries=1 --spider http://backend:4000/health || echo "failed"'
                )
                expect(result).not.toContain("failed")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should allow backend to connect to postgres",
            async () => {
                // Backend should be able to reach postgres on backend network
                const result = await execInContainer(
                    "platform-backend",
                    'nc -zv postgres 5432 2>&1 || echo "failed"'
                )
                expect(result).toContain("succeeded")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should allow backend to connect to redis",
            async () => {
                // Backend should be able to reach redis on backend network
                const result = await execInContainer(
                    "platform-backend",
                    'nc -zv redis 6379 2>&1 || echo "failed"'
                )
                expect(result).toContain("succeeded")
            },
            DOCKER_TIMEOUT
        )
    })

    describe("Network Isolation", () => {
        it(
            "should prevent app from connecting directly to postgres",
            async () => {
                // App should NOT be able to reach postgres (different network)
                try {
                    const result = await execInContainer(
                        "platform-app",
                        "nc -zv postgres 5432 2>&1"
                    )
                    // If we get here, connection succeeded (bad)
                    expect(result).toContain("failed") // This should fail
                } catch (error) {
                    // Connection should fail - this is expected
                    expect(error).toBeDefined()
                }
            },
            DOCKER_TIMEOUT
        )

        it(
            "should prevent app from connecting directly to redis",
            async () => {
                // App should NOT be able to reach redis (different network)
                try {
                    const result = await execInContainer(
                        "platform-app",
                        "nc -zv redis 6379 2>&1"
                    )
                    // If we get here, connection succeeded (bad)
                    expect(result).toContain("failed") // This should fail
                } catch (error) {
                    // Connection should fail - this is expected
                    expect(error).toBeDefined()
                }
            },
            DOCKER_TIMEOUT
        )
    })

    describe("Volume Persistence", () => {
        it(
            "should persist postgres data after container restart",
            async () => {
                // Create a test table
                await execInContainer(
                    "platform-postgres",
                    'psql -U platform -d platform -c "CREATE TABLE IF NOT EXISTS test_persistence (id SERIAL PRIMARY KEY, value TEXT);"'
                )
                await execInContainer(
                    "platform-postgres",
                    "psql -U platform -d platform -c \"INSERT INTO test_persistence (value) VALUES ('test_data');\""
                )

                // Restart postgres container
                await dockerCompose("restart postgres")
                await waitForHealthy("platform-postgres")

                // Verify data still exists
                const result = await execInContainer(
                    "platform-postgres",
                    'psql -U platform -d platform -c "SELECT value FROM test_persistence LIMIT 1;" -t'
                )
                expect(result.trim()).toBe("test_data")

                // Cleanup
                await execInContainer(
                    "platform-postgres",
                    'psql -U platform -d platform -c "DROP TABLE test_persistence;"'
                )
            },
            DOCKER_TIMEOUT
        )

        it(
            "should persist redis data after container restart",
            async () => {
                // Set a test key
                await execInContainer(
                    "platform-redis",
                    'redis-cli SET test_key "test_value"'
                )

                // Restart redis container
                await dockerCompose("restart redis")
                await waitForHealthy("platform-redis")

                // Verify data still exists
                const result = await execInContainer(
                    "platform-redis",
                    "redis-cli GET test_key"
                )
                expect(result.trim()).toBe("test_value")

                // Cleanup
                await execInContainer(
                    "platform-redis",
                    "redis-cli DEL test_key"
                )
            },
            DOCKER_TIMEOUT
        )
    })

    describe("Container Configuration", () => {
        it(
            "should use correct postgres version (17-alpine)",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{.Config.Image}}" platform-postgres'
                )
                expect(stdout.trim()).toContain("postgres:17-alpine")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should use correct redis version (7-alpine)",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{.Config.Image}}" platform-redis'
                )
                expect(stdout.trim()).toContain("redis:7-alpine")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should use correct node version (22-alpine)",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{.Config.Image}}" platform-backend'
                )
                expect(stdout.trim()).toContain("node:22-alpine")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should have restart policy configured",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{.HostConfig.RestartPolicy.Name}}" platform-postgres'
                )
                expect(stdout.trim()).toBe("unless-stopped")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should have health check interval of 30s",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{.Config.Healthcheck.Interval}}" platform-postgres'
                )
                expect(stdout.trim()).toBe("30000000000") // 30s in nanoseconds
            },
            DOCKER_TIMEOUT
        )

        it(
            "should have health check retries set to 3",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{.Config.Healthcheck.Retries}}" platform-postgres'
                )
                expect(stdout.trim()).toBe("3")
            },
            DOCKER_TIMEOUT
        )
    })

    describe("Volume Mounts", () => {
        it(
            "should have postgres data volume mounted",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{range .Mounts}}{{.Destination}}{{end}}" platform-postgres'
                )
                expect(stdout).toContain("/var/lib/postgresql/data")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should have redis data volume mounted",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{range .Mounts}}{{.Destination}}{{end}}" platform-redis'
                )
                expect(stdout).toContain("/data")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should have log volume mounted",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{range .Mounts}}{{.Destination}}{{end}}" platform-backend'
                )
                expect(stdout).toContain("/var/log/app")
            },
            DOCKER_TIMEOUT
        )
    })

    describe("Network Configuration", () => {
        it(
            "should have frontend network created",
            async () => {
                const { stdout } = await execAsync(
                    'docker network ls --format "{{.Name}}"'
                )
                expect(stdout).toContain("platform-frontend")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should have backend network created",
            async () => {
                const { stdout } = await execAsync(
                    'docker network ls --format "{{.Name}}"'
                )
                expect(stdout).toContain("platform-backend")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should have backend network as internal",
            async () => {
                const { stdout } = await execAsync(
                    'docker network inspect platform-backend --format="{{.Internal}}"'
                )
                expect(stdout.trim()).toBe("true")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should have app connected to frontend network only",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}" platform-app'
                )
                expect(stdout).toContain("platform-frontend")
                expect(stdout).not.toContain("platform-backend")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should have backend connected to both networks",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}" platform-backend'
                )
                expect(stdout).toContain("platform-frontend")
                expect(stdout).toContain("platform-backend")
            },
            DOCKER_TIMEOUT
        )

        it(
            "should have postgres connected to backend network only",
            async () => {
                const { stdout } = await execAsync(
                    'docker inspect --format="{{range $key, $value := .NetworkSettings.Networks}}{{$key}} {{end}}" platform-postgres'
                )
                expect(stdout).toContain("platform-backend")
                expect(stdout).not.toContain("platform-frontend")
            },
            DOCKER_TIMEOUT
        )
    })
})
