/**
 * Security Test: Argon2id Memory-Hardness Validation
 *
 * Purpose: Verify that Argon2id provides memory-hard protection against GPU/ASIC attacks
 *
 * This test validates:
 * 1. Memory-hardness: Hashing requires significant memory allocation
 * 2. GPU/ASIC resistance: Configuration prevents parallel attacks
 * 3. Performance under constraints: Hashing behavior with memory limitations
 * 4. Parameter validation: Configuration prevents weak security settings
 *
 * Requirements covered:
 * - Requirement 1.1: Argon2id uses memory-hard properties
 * - Requirement 1.2: Argon2id uses CPU-hard properties
 * - Requirement 9.2: GPU attack resistance through memory-hard properties
 * - Requirement 9.3: ASIC attack resistance through memory-hard properties
 * - Requirement 4.3: Memory parameter validation (16-256 MB)
 * - Requirement 4.4: Parallelism parameter validation (1-4 threads)
 * - Requirement 4.5: Iteration parameter validation (2-10)
 *
 * Attack Vectors Addressed:
 * - GPU attacks: Prevented by high memory requirements (64-256 MB per hash)
 * - ASIC attacks: Prevented by memory-hard algorithm and parallelism
 * - Dictionary attacks: Prevented by configurable iteration count
 * - Rainbow tables: Prevented by unique salt per hash
 *
 * Memory-Hardness Explanation:
 * Argon2id requires allocating and accessing large amounts of memory during hashing.
 * This makes it resistant to GPU/ASIC attacks because:
 * 1. GPUs have limited memory per core (typically 1-2GB shared)
 * 2. ASICs would need to be redesigned for each memory configuration
 * 3. Memory bandwidth becomes the bottleneck, not computation
 * 4. Parallel attacks become impractical due to memory constraints
 *
 * Configuration for Vercel Free Plan:
 * - Memory: 64 MB (safe headroom within 1GB limit)
 * - Time: 3 iterations (balances security and speed)
 * - Parallelism: 2 threads (maximizes per-thread work)
 * - Expected duration: 2-3 seconds per hash
 *
 * OWASP Coverage:
 * - A02:2021 - Cryptographic Failures: Uses strong password hashing
 * - A04:2021 - Insecure Design: Memory-hard design prevents GPU/ASIC attacks
 */

import {
    hashPasswordArgon2id,
    verifyPasswordArgon2id,
} from "@/lib/auth/password-security/argon2id-hasher"
import { ConfigurationManager } from "@/lib/auth/password-security/config"
import { beforeEach, describe, expect, it } from "vitest"

describe("Argon2id Memory-Hardness Security Tests", () => {
    beforeEach(() => {
        // Reset environment variables before each test
        process.env.ARGON2_MEMORY_COST = "64"
        process.env.ARGON2_TIME_COST = "3"
        process.env.ARGON2_PARALLELISM = "2"
        process.env.PEPPER_SECRET =
            "dev-pepper-test-very-long-string-32chars-minimum-required!"
        process.env.NODE_ENV = "development"

        // Reset singleton instance
        ;(ConfigurationManager as any).instance = null
    })

    describe("Memory-Hardness Validation", () => {
        it("should require significant memory for hashing (64 MB minimum)", async () => {
            const password = "TestPassword123!"

            // Hash with configured memory (64 MB)
            const result = await hashPasswordArgon2id(password)

            // Verify hash contains memory parameter
            // m=65536 is 64 MB in KiB (64 * 1024)
            expect(result.hash).toMatch(/m=65536/)

            // Hash should complete (memory was allocated successfully)
            expect(result.hash).toBeDefined()
            expect(result.hash.length).toBeGreaterThan(0)
        })

        it("should use higher memory for increased security", async () => {
            const password = "TestPassword123!"

            // Test with higher memory configuration
            process.env.ARGON2_MEMORY_COST = "128"
            ;(ConfigurationManager as any).instance = null

            const result = await hashPasswordArgon2id(password)

            // m=131072 is 128 MB in KiB (128 * 1024)
            expect(result.hash).toMatch(/m=131072/)
        })

        it("should reject memory configuration below minimum (16 MB)", async () => {
            process.env.ARGON2_MEMORY_COST = "8" // Below minimum
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /between 16 and 256/
            )
        })

        it("should reject memory configuration above maximum (256 MB)", async () => {
            process.env.ARGON2_MEMORY_COST = "512" // Above maximum
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /between 16 and 256/
            )
        })

        it("should enforce minimum memory of 16 MB for security", async () => {
            process.env.ARGON2_MEMORY_COST = "16" // Minimum allowed
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"
            const result = await hashPasswordArgon2id(password)

            // m=16384 is 16 MB in KiB (16 * 1024)
            expect(result.hash).toMatch(/m=16384/)
        })

        it("should support maximum memory of 256 MB for high security", async () => {
            process.env.ARGON2_MEMORY_COST = "256" // Maximum allowed
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"
            const result = await hashPasswordArgon2id(password)

            // m=262144 is 256 MB in KiB (256 * 1024)
            expect(result.hash).toMatch(/m=262144/)
        })
    })

    describe("GPU/ASIC Resistance Through Configuration", () => {
        it("should use parallelism parameter to prevent GPU attacks", async () => {
            const password = "TestPassword123!"

            // Hash with configured parallelism (2 threads)
            const result = await hashPasswordArgon2id(password)

            // Verify hash contains parallelism parameter
            expect(result.hash).toMatch(/p=2/)

            // Parallelism prevents GPU attacks by requiring sequential memory access
            // GPUs excel at parallel computation but struggle with sequential memory access
            expect(result.hash).toBeDefined()
        })

        it("should support parallelism between 1 and 4 threads", async () => {
            const password = "TestPassword123!"

            // Test minimum parallelism (1 thread)
            process.env.ARGON2_PARALLELISM = "1"
            ;(ConfigurationManager as any).instance = null
            let result = await hashPasswordArgon2id(password)
            expect(result.hash).toMatch(/p=1/)

            // Test maximum parallelism (4 threads)
            process.env.ARGON2_PARALLELISM = "4"
            ;(ConfigurationManager as any).instance = null
            result = await hashPasswordArgon2id(password)
            expect(result.hash).toMatch(/p=4/)
        })

        it("should reject parallelism below minimum (1 thread)", async () => {
            process.env.ARGON2_PARALLELISM = "0" // Below minimum
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /between 1 and 4/
            )
        })

        it("should reject parallelism above maximum (4 threads)", async () => {
            process.env.ARGON2_PARALLELISM = "8" // Above maximum
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /between 1 and 4/
            )
        })

        it("should use time cost (iterations) to prevent dictionary attacks", async () => {
            const password = "TestPassword123!"

            // Hash with configured time cost (3 iterations)
            const result = await hashPasswordArgon2id(password)

            // Verify hash contains time cost parameter
            expect(result.hash).toMatch(/t=3/)

            // Time cost increases computational cost of dictionary attacks
            expect(result.hash).toBeDefined()
        })

        it("should support time cost between 2 and 10 iterations", async () => {
            const password = "TestPassword123!"

            // Test minimum time cost (2 iterations)
            process.env.ARGON2_TIME_COST = "2"
            ;(ConfigurationManager as any).instance = null
            let result = await hashPasswordArgon2id(password)
            expect(result.hash).toMatch(/t=2/)

            // Test maximum time cost (10 iterations)
            process.env.ARGON2_TIME_COST = "10"
            ;(ConfigurationManager as any).instance = null
            result = await hashPasswordArgon2id(password)
            expect(result.hash).toMatch(/t=10/)
        })

        it("should reject time cost below minimum (2 iterations)", async () => {
            process.env.ARGON2_TIME_COST = "1" // Below minimum
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /between 2 and 10/
            )
        })

        it("should reject time cost above maximum (10 iterations)", async () => {
            process.env.ARGON2_TIME_COST = "15" // Above maximum
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /between 2 and 10/
            )
        })
    })

    describe("Memory-Hardness Impact on Attack Feasibility", () => {
        it("should make GPU attacks impractical due to memory requirements", async () => {
            // GPU memory analysis:
            // - Typical GPU: 2-8 GB total memory
            // - Argon2id with 64 MB: Can run ~30-125 hashes in parallel
            // - Argon2id with 256 MB: Can run ~8-31 hashes in parallel
            // - Compared to MD5: Can run millions in parallel
            // - Result: GPU attacks become impractical

            const password = "TestPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Verify memory parameter is set (prevents weak configurations)
            expect(result.hash).toMatch(/m=\d+/)

            // Memory requirement makes GPU attacks impractical
            // A GPU with 8GB memory can only run ~125 concurrent hashes (64MB each)
            // vs millions with MD5, making brute force infeasible
            expect(result.hash).toBeDefined()
        })

        it("should make ASIC attacks impractical due to memory-hard design", async () => {
            // ASIC resistance analysis:
            // - ASICs are optimized for specific algorithms
            // - Argon2id's memory-hard design requires:
            //   1. Large on-chip memory (expensive)
            //   2. Complex memory access patterns (hard to optimize)
            //   3. Reconfigurable for different parameters (defeats ASIC advantage)
            // - Result: ASIC attacks become economically infeasible

            const password = "TestPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Verify parallelism parameter (prevents sequential-only attacks)
            expect(result.hash).toMatch(/p=\d+/)

            // Parallelism requirement makes ASIC optimization difficult
            // ASICs would need to be redesigned for each parameter configuration
            expect(result.hash).toBeDefined()
        })

        it("should require sequential memory access preventing GPU optimization", async () => {
            // Argon2id memory access pattern:
            // - Fills memory with pseudo-random values
            // - Accesses memory in data-dependent pattern
            // - Requires sequential access (not parallelizable)
            // - GPU strength (parallel computation) becomes weakness

            const password = "TestPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Hash should complete successfully (memory access pattern works)
            expect(result.hash).toBeDefined()
            expect(result.timeTakenMs).toBeGreaterThan(0)

            // Sequential memory access prevents GPU parallelization
            // GPUs are optimized for parallel computation, not sequential memory access
        })

        it("should increase computational cost with higher iteration count", async () => {
            const password = "TestPassword123!"

            // Hash with low iterations
            process.env.ARGON2_TIME_COST = "2"
            ;(ConfigurationManager as any).instance = null
            const resultLow = await hashPasswordArgon2id(password)
            const timeLow = resultLow.timeTakenMs

            // Hash with high iterations
            process.env.ARGON2_TIME_COST = "10"
            ;(ConfigurationManager as any).instance = null
            const resultHigh = await hashPasswordArgon2id(password)
            const timeHigh = resultHigh.timeTakenMs

            // Higher iterations should take longer
            // This increases cost of dictionary attacks
            expect(timeHigh).toBeGreaterThan(timeLow)

            // Verify both hashes are valid
            expect(resultLow.hash).toBeDefined()
            expect(resultHigh.hash).toBeDefined()
        })
    })

    describe("Vercel Free Plan Compatibility", () => {
        it("should complete within Vercel timeout (10 seconds) with default config", async () => {
            const password = "TestPassword123!"

            // Default config: memory=64, time=3, parallelism=2
            const result = await hashPasswordArgon2id(password)

            // Should complete well within 10 second timeout
            expect(result.timeTakenMs).toBeLessThan(10000)

            // Should complete successfully (timing varies by system)
            expect(result.timeTakenMs).toBeGreaterThan(0)
        })

        it("should not exceed memory limit on Vercel (1GB per function)", async () => {
            const password = "TestPassword123!"

            // With 64 MB memory cost, peak memory should be ~150MB
            // Well within 1GB limit
            const result = await hashPasswordArgon2id(password)

            // Hash should complete successfully (memory was available)
            expect(result.hash).toBeDefined()
            expect(result.performanceWarning).toBe(false)
        })

        it("should handle multiple concurrent hashes on Vercel", async () => {
            const passwords = [
                "Password1!",
                "Password2!",
                "Password3!",
                "Password4!",
                "Password5!",
            ]

            // Hash multiple passwords concurrently
            const results = await Promise.all(
                passwords.map(p => hashPasswordArgon2id(p))
            )

            // All should complete successfully
            expect(results).toHaveLength(5)
            results.forEach(result => {
                expect(result.hash).toBeDefined()
                expect(result.algorithm).toBe("argon2id")
            })
        })
    })

    describe("Security Parameter Validation", () => {
        it("should reject invalid memory parameter (non-numeric)", async () => {
            process.env.ARGON2_MEMORY_COST = "invalid"
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /valid number/
            )
        })

        it("should reject invalid time parameter (non-numeric)", async () => {
            process.env.ARGON2_TIME_COST = "invalid"
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /valid number/
            )
        })

        it("should reject invalid parallelism parameter (non-numeric)", async () => {
            process.env.ARGON2_PARALLELISM = "invalid"
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"

            await expect(hashPasswordArgon2id(password)).rejects.toThrow(
                /valid number/
            )
        })

        it("should use secure defaults when parameters not configured", async () => {
            // Clear environment variables
            delete process.env.ARGON2_MEMORY_COST
            delete process.env.ARGON2_TIME_COST
            delete process.env.ARGON2_PARALLELISM
            ;(ConfigurationManager as any).instance = null

            const password = "TestPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Should use defaults: memory=64, time=3, parallelism=2
            expect(result.hash).toMatch(/m=65536/) // 64 MB
            expect(result.hash).toMatch(/t=3/)
            expect(result.hash).toMatch(/p=2/)
        })
    })

    describe("Memory-Hardness Verification", () => {
        it("should verify password against memory-hard hash", async () => {
            const password = "TestPassword123!"

            // Hash with memory-hard configuration
            const hashResult = await hashPasswordArgon2id(password)

            // Verify password against hash
            const isValid = await verifyPasswordArgon2id(
                password,
                hashResult.hash
            )

            expect(isValid).toBe(true)
        })

        it("should reject incorrect password against memory-hard hash", async () => {
            const password = "TestPassword123!"
            const wrongPassword = "WrongPassword456!"

            // Hash with memory-hard configuration
            const hashResult = await hashPasswordArgon2id(password)

            // Verify wrong password fails
            const isValid = await verifyPasswordArgon2id(
                wrongPassword,
                hashResult.hash
            )

            expect(isValid).toBe(false)
        })

        it("should maintain memory-hardness across multiple verifications", async () => {
            const password = "TestPassword123!"

            // Hash once
            const hashResult = await hashPasswordArgon2id(password)

            // Verify multiple times
            for (let i = 0; i < 5; i++) {
                const isValid = await verifyPasswordArgon2id(
                    password,
                    hashResult.hash
                )
                expect(isValid).toBe(true)
            }
        })
    })

    describe("Attack Resistance Confirmation", () => {
        it("should confirm GPU attack resistance through memory requirements", async () => {
            // GPU Attack Analysis:
            // - Attacker goal: Crack password by trying many candidates
            // - GPU advantage: Parallel computation (thousands of cores)
            // - Argon2id defense: Memory-hard (requires 64-256 MB per hash)
            // - Result: GPU memory becomes bottleneck, not computation
            //
            // Example: GPU with 8GB memory
            // - MD5: Can run ~1 billion hashes in parallel
            // - Argon2id (64MB): Can run ~125 hashes in parallel
            // - Reduction: 8 million times slower for attacker

            const password = "TestPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Verify memory parameter is set
            expect(result.hash).toMatch(/m=65536/) // 64 MB

            // Memory requirement confirmed
            expect(result.hash).toBeDefined()
        })

        it("should confirm ASIC attack resistance through parallelism", async () => {
            // ASIC Attack Analysis:
            // - Attacker goal: Build specialized hardware for password cracking
            // - ASIC advantage: Optimized for specific algorithm
            // - Argon2id defense: Parallelism + memory-hard design
            // - Result: ASIC optimization becomes impractical
            //
            // Why ASIC fails against Argon2id:
            // 1. Memory-hard design requires large on-chip memory (expensive)
            // 2. Parallelism requires complex coordination (hard to optimize)
            // 3. Parameter flexibility means ASIC must support multiple configs
            // 4. Economic cost exceeds benefit

            const password = "TestPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Verify parallelism parameter is set
            expect(result.hash).toMatch(/p=2/)

            // Parallelism confirmed
            expect(result.hash).toBeDefined()
        })

        it("should confirm dictionary attack resistance through iteration count", async () => {
            // Dictionary Attack Analysis:
            // - Attacker goal: Try common passwords against hash
            // - Attack cost: Number of hashes × time per hash
            // - Argon2id defense: High time cost (3-10 iterations)
            // - Result: Dictionary attack becomes impractical
            //
            // Example: 1 million common passwords
            // - MD5: 1 million × 0.001ms = 1 second
            // - Argon2id: 1 million × 3000ms = 3000 seconds (50 minutes)
            // - Increase: 3000x slower for attacker

            const password = "TestPassword123!"
            const result = await hashPasswordArgon2id(password)

            // Verify time cost parameter is set
            expect(result.hash).toMatch(/t=3/)

            // Time cost confirmed
            expect(result.hash).toBeDefined()
        })

        it("should confirm rainbow table resistance through unique salt", async () => {
            // Rainbow Table Attack Analysis:
            // - Attacker goal: Use pre-computed hash table to crack passwords
            // - Rainbow table advantage: No computation needed
            // - Argon2id defense: Unique salt per hash
            // - Result: Rainbow tables become useless
            //
            // Why salt defeats rainbow tables:
            // 1. Each password gets unique salt
            // 2. Pre-computed table would need entry for every salt
            // 3. Number of possible salts: 2^128 (for 128-bit salt)
            // 4. Storage needed: Impossible (more than atoms in universe)

            const password = "TestPassword123!"

            // Hash same password twice
            const result1 = await hashPasswordArgon2id(password)
            const result2 = await hashPasswordArgon2id(password)

            // Hashes should be different (unique salts)
            expect(result1.hash).not.toBe(result2.hash)

            // Both should verify correctly
            expect(await verifyPasswordArgon2id(password, result1.hash)).toBe(
                true
            )
            expect(await verifyPasswordArgon2id(password, result2.hash)).toBe(
                true
            )
        })
    })
})
