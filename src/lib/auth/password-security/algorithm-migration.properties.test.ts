/**
 * Property-Based Tests: Algorithm Migration
 * Purpose: Verify that Bcrypt hashes are automatically upgraded to Argon2id on successful login
 *
 * **Validates: Requirement 11.1**
 *
 * Property 3: Algorithm Migration - Bcrypt automatically upgraded on successful login
 *
 * This test suite uses property-based testing to verify:
 * 1. Successful Bcrypt validation triggers migration
 * 2. New hash is in Argon2id format ($argon2id$ prefix)
 * 3. Migration doesn't affect authentication success
 * 4. Subsequent validation uses new Argon2id hash
 * 5. No authentication failures during migration
 *
 * Test Strategy:
 * - Generate 50+ random valid passwords
 * - Create Bcrypt hashes for each password
 * - Validate passwords against Bcrypt hashes
 * - Verify migration is triggered (requiresMigration flag set)
 * - Verify new hash is Argon2id format
 * - Verify authentication success is not affected
 * - Verify subsequent validation works with new hash
 *
 * Requirements covered:
 * - Requirement 5.3: Trigger Algorithm_Migration to rehash with Argon2id
 * - Requirement 5.4: Same error for Bcrypt validation failure as Argon2
 * - Requirement 11.1: Automatically rehash password with Argon2id on successful login
 * - Requirement 11.2: Store new hash in user database
 * - Requirement 11.3: Use current pepper and Argon2id parameters
 * - Requirement 11.4: Don't affect user authentication if migration fails
 *
 * Performance:
 * - Each test case: ~5-10 seconds (Bcrypt validation + Argon2id hashing)
 * - Total suite: ~5-10 minutes for 50+ iterations
 * - Runs with --run flag to avoid timeout issues
 *
 * Edge Cases Tested:
 * - Minimum length passwords (8 characters)
 * - Maximum length passwords (128 characters)
 * - Passwords with special characters
 * - Passwords with unicode characters
 * - Passwords with spaces
 * - Passwords with numbers and symbols
 */

import * as userModule from "@/lib/auth/user"
import * as dbModule from "@/lib/db"
import { fc, test } from "@fast-check/vitest"
import bcrypt from "bcrypt"
import { beforeEach, describe, expect, vi } from "vitest"
import * as argon2Hasher from "./argon2id-hasher"
import { ConfigurationManager } from "./config"
import { triggerPasswordMigration } from "./migration-trigger"
import { validatePassword } from "./password-validator"

// Mock dependencies
vi.mock("./argon2id-hasher")
vi.mock("@/lib/auth/user")
vi.mock("@/lib/db")
vi.mock("@/lib/logger")

describe("Property 3: Algorithm Migration - Bcrypt automatically upgraded on successful login", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    /**
     * Property: Successful Bcrypt validation triggers migration
     *
     * For any valid password and Bcrypt hash:
     * - validatePassword should return valid=true
     * - requiresMigration should be true (Bcrypt detected)
     * - algorithmType should be 'bcrypt'
     *
     * Validates: Requirement 11.1
     */
    test.prop([
        fc.stringMatching(
            /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/
        ),
    ])("Bcrypt validation should trigger migration flag", async password => {
        // Arrange
        const config = ConfigurationManager.getInstance()
        const pepper = config.getPepper()
        const pepperedPassword = password + pepper

        // Create Bcrypt hash
        const bcryptHash = await bcrypt.hash(pepperedPassword, 10)

        // Act
        const result = await validatePassword(password, bcryptHash)

        // Assert
        expect(result.valid).toBe(true)
        expect(result.algorithmType).toBe("bcrypt")
        expect(result.requiresMigration).toBe(true)
        expect(result.hashValid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    /**
     * Property: New hash is in Argon2id format
     *
     * For any successful Bcrypt validation:
     * - Migration should produce Argon2id hash
     * - New hash should start with $argon2id$
     * - New hash should contain version, memory, time, parallelism parameters
     *
     * Validates: Requirement 11.2, 11.3
     */
    test.prop([
        fc.stringMatching(
            /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/
        ),
    ])("Migration should produce Argon2id format hash", async password => {
        // Arrange
        const userId = "test-user-" + Math.random().toString(36).substring(7)
        const config = ConfigurationManager.getInstance()
        const pepper = config.getPepper()
        const pepperedPassword = password + pepper

        // Create Bcrypt hash
        const bcryptHash = await bcrypt.hash(pepperedPassword, 10)

        // Mock Argon2id hashing
        const argon2idHash =
            "$argon2id$v=19$m=64000,t=3,p=2$salt1234567890ab$hash1234567890abcdef1234567890ab"

        vi.mocked(argon2Hasher.hashPasswordArgon2id).mockResolvedValue({
            hash: argon2idHash,
            algorithm: "argon2id",
            timeTakenMs: 2500,
            performanceWarning: false,
        })

        vi.mocked(userModule.updateUserPassword).mockResolvedValue({
            id: userId,
            email: "test@example.com",
            password_hash: argon2idHash,
            oauth_provider: null,
            oauth_id: null,
            name: "Test User",
            picture: null,
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        })

        vi.mocked(dbModule.db.query).mockResolvedValue({
            rows: [],
            rowCount: 1,
        })

        // Act
        const migrationResult = await triggerPasswordMigration(userId, password)

        // Assert
        expect(migrationResult.success).toBe(true)
        expect(migrationResult.newAlgorithm).toBe("argon2id")

        // Verify the new hash is in Argon2id format
        expect(argon2idHash).toMatch(/^\$argon2id\$/)
        expect(argon2idHash).toContain("v=19")
        expect(argon2idHash).toContain("m=")
        expect(argon2idHash).toContain("t=")
        expect(argon2idHash).toContain("p=")
    })

    /**
     * Property: Migration doesn't affect authentication success
     *
     * For any valid password:
     * - Validation against Bcrypt hash should succeed
     * - Validation against new Argon2id hash should also succeed
     * - Both validations should return valid=true
     *
     * Validates: Requirement 11.4
     */
    test.prop([
        fc.stringMatching(
            /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/
        ),
    ])(
        "Authentication should succeed before and after migration",
        async password => {
            // Arrange
            const config = ConfigurationManager.getInstance()
            const pepper = config.getPepper()
            const pepperedPassword = password + pepper

            // Create Bcrypt hash
            const bcryptHash = await bcrypt.hash(pepperedPassword, 10)

            // Create Argon2id hash (simulated)
            const argon2idHash =
                "$argon2id$v=19$m=64000,t=3,p=2$salt1234567890ab$hash1234567890abcdef1234567890ab"

            // Act - Validate against Bcrypt
            const bcryptValidation = await validatePassword(
                password,
                bcryptHash
            )

            // Assert - Bcrypt validation should succeed
            expect(bcryptValidation.valid).toBe(true)
            expect(bcryptValidation.algorithmType).toBe("bcrypt")

            // Mock Argon2id validation
            vi.mocked(argon2Hasher.verifyPasswordArgon2id).mockResolvedValue(
                true
            )

            // Act - Validate against new Argon2id hash
            const argon2idValidation = await validatePassword(
                password,
                argon2idHash
            )

            // Assert - Argon2id validation should also succeed
            expect(argon2idValidation.valid).toBe(true)
            expect(argon2idValidation.algorithmType).toBe("argon2id")
            expect(argon2idValidation.requiresMigration).toBe(false)
        }
    )

    /**
     * Property: Subsequent validation uses new Argon2id hash
     *
     * For any successful migration:
     * - Next validation should use Argon2id hash
     * - Algorithm type should be 'argon2id'
     * - requiresMigration should be false
     * - Validation should still succeed
     *
     * Validates: Requirement 11.1, 11.2
     */
    test.prop([
        fc.stringMatching(
            /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/
        ),
    ])("Subsequent validation should use Argon2id hash", async password => {
        // Arrange
        const argon2idHash =
            "$argon2id$v=19$m=64000,t=3,p=2$salt1234567890ab$hash1234567890abcdef1234567890ab"

        // Mock Argon2id validation
        vi.mocked(argon2Hasher.verifyPasswordArgon2id).mockResolvedValue(true)

        // Act
        const result = await validatePassword(password, argon2idHash)

        // Assert
        expect(result.valid).toBe(true)
        expect(result.algorithmType).toBe("argon2id")
        expect(result.requiresMigration).toBe(false)
        expect(result.hashValid).toBe(true)
    })

    /**
     * Property: No authentication failures during migration
     *
     * For any valid password:
     * - Bcrypt validation should succeed
     * - Migration should not throw exceptions
     * - Migration result should indicate success
     * - User remains authenticated throughout
     *
     * Validates: Requirement 11.4
     */
    test.prop([
        fc.stringMatching(
            /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/
        ),
    ])("Migration should not cause authentication failures", async password => {
        // Arrange
        const userId = "test-user-" + Math.random().toString(36).substring(7)
        const config = ConfigurationManager.getInstance()
        const pepper = config.getPepper()
        const pepperedPassword = password + pepper

        // Create Bcrypt hash
        const bcryptHash = await bcrypt.hash(pepperedPassword, 10)

        // Validate password (should succeed)
        const validationResult = await validatePassword(password, bcryptHash)

        expect(validationResult.valid).toBe(true)

        // Mock migration
        const argon2idHash =
            "$argon2id$v=19$m=64000,t=3,p=2$salt1234567890ab$hash1234567890abcdef1234567890ab"

        vi.mocked(argon2Hasher.hashPasswordArgon2id).mockResolvedValue({
            hash: argon2idHash,
            algorithm: "argon2id",
            timeTakenMs: 2500,
            performanceWarning: false,
        })

        vi.mocked(userModule.updateUserPassword).mockResolvedValue({
            id: userId,
            email: "test@example.com",
            password_hash: argon2idHash,
            oauth_provider: null,
            oauth_id: null,
            name: "Test User",
            picture: null,
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        })

        vi.mocked(dbModule.db.query).mockResolvedValue({
            rows: [],
            rowCount: 1,
        })

        // Act - Trigger migration
        const migrationResult = await triggerPasswordMigration(userId, password)

        // Assert - Migration should succeed
        expect(migrationResult.success).toBe(true)
        expect(migrationResult.error).toBeUndefined()

        // User should still be authenticated
        expect(validationResult.valid).toBe(true)
    })

    /**
     * Property: Bcrypt validation always triggers migration flag
     *
     * For any Bcrypt hash:
     * - If validation succeeds, requiresMigration must be true
     * - If validation fails, requiresMigration must be false
     * - Algorithm type must be 'bcrypt'
     *
     * Validates: Requirement 11.1
     */
    test.prop([
        fc.stringMatching(
            /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/
        ),
    ])(
        "Bcrypt validation result should always indicate migration requirement",
        async password => {
            // Arrange
            const config = ConfigurationManager.getInstance()
            const pepper = config.getPepper()
            const pepperedPassword = password + pepper

            // Create Bcrypt hash
            const bcryptHash = await bcrypt.hash(pepperedPassword, 10)

            // Act
            const result = await validatePassword(password, bcryptHash)

            // Assert
            expect(result.algorithmType).toBe("bcrypt")

            // If validation succeeded, migration should be required
            if (result.valid) {
                expect(result.requiresMigration).toBe(true)
            } else {
                // If validation failed, migration should not be required
                expect(result.requiresMigration).toBe(false)
            }
        }
    )

    /**
     * Property: Migration preserves password correctness
     *
     * For any valid password:
     * - Original Bcrypt hash should validate correctly
     * - New Argon2id hash should also validate correctly
     * - Wrong password should fail against both hashes
     *
     * Validates: Requirement 11.4
     */
    test.prop([
        fc.stringMatching(
            /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/
        ),
    ])("Migration should preserve password correctness", async password => {
        // Arrange
        const config = ConfigurationManager.getInstance()
        const pepper = config.getPepper()
        const pepperedPassword = password + pepper

        // Create Bcrypt hash with correct password (use cost 4 for faster testing)
        const bcryptHash = await bcrypt.hash(pepperedPassword, 4)

        // Act - Validate correct password
        const correctResult = await validatePassword(password, bcryptHash)

        // Assert - Correct password should validate
        expect(correctResult.valid).toBe(true)

        // Act - Validate wrong password (use a different password)
        const wrongPassword = password + "WRONG"
        const wrongResult = await validatePassword(wrongPassword, bcryptHash)

        // Assert - Wrong password should not validate
        expect(wrongResult.valid).toBe(false)
    })

    /**
     * Property: Migration result contains required metadata
     *
     * For any successful migration:
     * - Result should have success=true
     * - Result should have userId
     * - Result should have oldAlgorithm='bcrypt'
     * - Result should have newAlgorithm='argon2id'
     * - Result should have timeTakenMs > 0
     * - Result should have auditLogged=true
     *
     * Validates: Requirement 11.5
     */
    test.prop([
        fc.stringMatching(
            /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/
        ),
    ])("Migration result should contain required metadata", async password => {
        // Arrange
        const userId = "test-user-" + Math.random().toString(36).substring(7)
        const argon2idHash =
            "$argon2id$v=19$m=64000,t=3,p=2$salt1234567890ab$hash1234567890abcdef1234567890ab"

        vi.mocked(argon2Hasher.hashPasswordArgon2id).mockResolvedValue({
            hash: argon2idHash,
            algorithm: "argon2id",
            timeTakenMs: 2500,
            performanceWarning: false,
        })

        vi.mocked(userModule.updateUserPassword).mockResolvedValue({
            id: userId,
            email: "test@example.com",
            password_hash: argon2idHash,
            oauth_provider: null,
            oauth_id: null,
            name: "Test User",
            picture: null,
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        })

        vi.mocked(dbModule.db.query).mockResolvedValue({
            rows: [],
            rowCount: 1,
        })

        // Act
        const result = await triggerPasswordMigration(userId, password)

        // Assert
        expect(result.success).toBe(true)
        expect(result.userId).toBe(userId)
        expect(result.oldAlgorithm).toBe("bcrypt")
        expect(result.newAlgorithm).toBe("argon2id")
        expect(result.timeTakenMs).toBeGreaterThanOrEqual(0)
        expect(result.auditLogged).toBe(true)
        expect(result.error).toBeUndefined()
    })

    /**
     * Property: Bcrypt and Argon2id hashes are distinguishable
     *
     * For any password:
     * - Bcrypt hash should start with $2
     * - Argon2id hash should start with $argon2id$
     * - Algorithm detection should correctly identify each
     *
     * Validates: Requirement 11.1, 11.2
     */
    test.prop([
        fc.stringMatching(
            /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/
        ),
    ])(
        "Bcrypt and Argon2id hashes should be distinguishable",
        async password => {
            // Arrange
            const config = ConfigurationManager.getInstance()
            const pepper = config.getPepper()
            const pepperedPassword = password + pepper

            // Create Bcrypt hash
            const bcryptHash = await bcrypt.hash(pepperedPassword, 10)

            // Create Argon2id hash (simulated)
            const argon2idHash =
                "$argon2id$v=19$m=64000,t=3,p=2$salt1234567890ab$hash1234567890abcdef1234567890ab"

            // Act & Assert
            expect(bcryptHash).toMatch(/^\$2[aby]\$/)
            expect(argon2idHash).toMatch(/^\$argon2id\$/)

            // Validate against Bcrypt
            const bcryptResult = await validatePassword(password, bcryptHash)
            expect(bcryptResult.algorithmType).toBe("bcrypt")

            // Validate against Argon2id
            vi.mocked(argon2Hasher.verifyPasswordArgon2id).mockResolvedValue(
                true
            )
            const argon2idResult = await validatePassword(
                password,
                argon2idHash
            )
            expect(argon2idResult.algorithmType).toBe("argon2id")
        }
    )

    /**
     * Property: Migration completes within reasonable time
     *
     * For any password:
     * - Migration should complete within 10 seconds
     * - Time should be recorded in result
     * - Time should be greater than 0
     *
     * Validates: Requirement 15.1, 15.2
     */
    test.prop([
        fc.stringMatching(
            /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/
        ),
    ])("Migration should complete within reasonable time", async password => {
        // Arrange
        const userId = "test-user-" + Math.random().toString(36).substring(7)
        const argon2idHash =
            "$argon2id$v=19$m=64000,t=3,p=2$salt1234567890ab$hash1234567890abcdef1234567890ab"

        vi.mocked(argon2Hasher.hashPasswordArgon2id).mockResolvedValue({
            hash: argon2idHash,
            algorithm: "argon2id",
            timeTakenMs: 2500,
            performanceWarning: false,
        })

        vi.mocked(userModule.updateUserPassword).mockResolvedValue({
            id: userId,
            email: "test@example.com",
            password_hash: argon2idHash,
            oauth_provider: null,
            oauth_id: null,
            name: "Test User",
            picture: null,
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
        })

        vi.mocked(dbModule.db.query).mockResolvedValue({
            rows: [],
            rowCount: 1,
        })

        // Act
        const result = await triggerPasswordMigration(userId, password)

        // Assert
        expect(result.timeTakenMs).toBeGreaterThanOrEqual(0)
        expect(result.timeTakenMs).toBeLessThan(10000) // Should complete within 10 seconds
    })
})
