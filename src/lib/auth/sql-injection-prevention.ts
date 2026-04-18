/**
 * SQL Injection Prevention Functions
 * Provides detection and prevention of SQL injection attacks
 * Validates: Requirements 7.5, 11.1, 11.2, 11.3
 */

/**
 * List of SQL keywords that indicate potential SQL injection attempts
 * This is a non-exhaustive list of common SQL keywords
 */
const SQL_KEYWORDS = [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "CREATE",
    "ALTER",
    "EXEC",
    "EXECUTE",
    "UNION",
    "FROM",
    "WHERE",
    "AND",
    "OR",
    "NOT",
    "IN",
    "EXISTS",
    "BETWEEN",
    "LIKE",
    "IS",
    "NULL",
    "TRUE",
    "FALSE",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    "ORDER",
    "BY",
    "GROUP",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "JOIN",
    "LEFT",
    "RIGHT",
    "INNER",
    "OUTER",
    "ON",
    "CROSS",
    "FULL",
    "NATURAL",
    "USING",
    "DISTINCT",
    "ALL",
    "AS",
    "WITH",
    "RECURSIVE",
    "CAST",
    "CONVERT",
    "COALESCE",
    "NULLIF",
    "IFNULL",
    "ISNULL",
    "SUBSTRING",
    "CONCAT",
    "LENGTH",
    "UPPER",
    "LOWER",
    "TRIM",
    "REPLACE",
    "ROUND",
    "ABS",
    "CEIL",
    "FLOOR",
    "RAND",
    "NOW",
    "CURRENT_DATE",
    "CURRENT_TIME",
    "CURRENT_TIMESTAMP",
    "DATE",
    "TIME",
    "TIMESTAMP",
    "INTERVAL",
    "EXTRACT",
    "YEAR",
    "MONTH",
    "DAY",
    "HOUR",
    "MINUTE",
    "SECOND",
    "WEEK",
    "QUARTER",
    "DAYOFWEEK",
    "DAYOFYEAR",
    "WEEKOFYEAR",
    "LAST_INSERT_ID",
    "ROW_COUNT",
    "FOUND_ROWS",
    "SQL_CALC_FOUND_ROWS",
    "PRAGMA",
    "ATTACH",
    "DETACH",
    "VACUUM",
    "ANALYZE",
    "EXPLAIN",
    "PLAN",
    "QUERY",
    "PROFILE",
    "TRACE",
    "DEBUG",
    "INFORMATION_SCHEMA",
    "MYSQL",
    "PERFORMANCE_SCHEMA",
    "SYS",
    "ADMIN",
    "MASTER",
    "SLAVE",
    "REPLICATION",
    "BACKUP",
    "RESTORE",
    "GRANT",
    "REVOKE",
    "FLUSH",
    "SHOW",
    "DESCRIBE",
    "DESC",
    "EXPLAIN",
    "HELP",
    "USE",
    "CALL",
    "DECLARE",
    "SET",
    "RESET",
    "KILL",
    "LOCK",
    "UNLOCK",
    "COMMIT",
    "ROLLBACK",
    "SAVEPOINT",
    "START",
    "TRANSACTION",
    "BEGIN",
    "END",
    "HANDLER",
    "OPEN",
    "CLOSE",
    "FETCH",
    "PREPARE",
    "DEALLOCATE",
    "CURSOR",
    "PROCEDURE",
    "FUNCTION",
    "TRIGGER",
    "EVENT",
    "VIEW",
    "INDEX",
    "CONSTRAINT",
    "KEY",
    "PRIMARY",
    "FOREIGN",
    "UNIQUE",
    "CHECK",
    "DEFAULT",
    "AUTO_INCREMENT",
    "COLLATE",
    "CHARSET",
    "ENGINE",
    "PARTITION",
    "SUBPARTITION",
    "RANGE",
    "LIST",
    "HASH",
    "LINEAR",
    "COLUMNS",
    "ALGORITHM",
    "DEFINER",
    "SQL",
    "SECURITY",
    "INVOKER",
    "DETERMINISTIC",
    "READS",
    "MODIFIES",
    "DATA",
    "CONTAINS",
    "COMMENT",
    "RETURNS",
    "LANGUAGE",
    "EXTERNAL",
    "SONAME",
    "AGGREGATE",
    "BINARY",
    "UNSIGNED",
    "ZEROFILL",
    "SIGNED",
    "FLOAT",
    "DOUBLE",
    "DECIMAL",
    "NUMERIC",
    "REAL",
    "PRECISION",
    "SCALE",
    "TINYINT",
    "SMALLINT",
    "MEDIUMINT",
    "INT",
    "INTEGER",
    "BIGINT",
    "FLOAT",
    "DOUBLE",
    "DECIMAL",
    "NUMERIC",
    "CHAR",
    "VARCHAR",
    "BINARY",
    "VARBINARY",
    "TINYBLOB",
    "BLOB",
    "MEDIUMBLOB",
    "LONGBLOB",
    "TINYTEXT",
    "TEXT",
    "MEDIUMTEXT",
    "LONGTEXT",
    "ENUM",
    "SET",
    "JSON",
    "GEOMETRY",
    "POINT",
    "LINESTRING",
    "POLYGON",
    "MULTIPOINT",
    "MULTILINESTRING",
    "MULTIPOLYGON",
    "GEOMETRYCOLLECTION",
]

/**
 * Detects potential SQL injection patterns in user input
 * Requirement 7.5, 11.1, 11.2, 11.3
 *
 * @param input - The input string to check
 * @returns Object with detected boolean and details about what was found
 *
 * @example
 * detectSqlInjection("test@example.com") // { detected: false }
 * detectSqlInjection("test'; DROP TABLE users; --") // { detected: true, pattern: "SQL keyword" }
 */
export function detectSqlInjection(input: string): {
    detected: boolean
    pattern?: string
    keyword?: string
} {
    if (!input || typeof input !== "string") {
        return { detected: false }
    }

    const upperInput = input.toUpperCase()

    // Check for SQL keywords
    for (const keyword of SQL_KEYWORDS) {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, "i")
        if (keywordRegex.test(input)) {
            return {
                detected: true,
                pattern: "SQL keyword",
                keyword,
            }
        }
    }

    // Check for common SQL injection patterns
    const injectionPatterns = [
        /['";]/, // Single quote, double quote, semicolon
        /--/, // SQL comment
        /\/\*/, // Multi-line comment start
        /\*\//, // Multi-line comment end
        /xp_/, // Extended stored procedures
        /sp_/, // System stored procedures
        /;.*DROP/i,
        /;.*DELETE/i,
        /;.*UPDATE/i,
        /;.*INSERT/i,
        /UNION.*SELECT/i,
        /OR\s+1\s*=\s*1/i,
        /OR\s+'1'\s*=\s*'1'/i,
        /OR\s+true/i,
        /EXEC\s*\(/i,
        /EXECUTE\s*\(/i,
        /SCRIPT/i,
        /JAVASCRIPT/i,
        /ONERROR/i,
        /ONLOAD/i,
        /ONCLICK/i,
    ]

    for (const pattern of injectionPatterns) {
        if (pattern.test(input)) {
            return {
                detected: true,
                pattern: pattern.source,
            }
        }
    }

    return { detected: false }
}

/**
 * Validates input against SQL injection attempts
 * Requirement 7.5, 11.1, 11.2, 11.3
 *
 * @param input - The input string to validate
 * @param fieldName - The name of the field (for error message)
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validateAgainstSqlInjection("test@example.com", "email")
 * // { isValid: true }
 *
 * validateAgainstSqlInjection("test'; DROP TABLE users; --", "email")
 * // { isValid: false, error: "Input contains suspicious SQL patterns" }
 */
export function validateAgainstSqlInjection(
    input: string,
    fieldName: string
): { isValid: boolean; error?: string } {
    if (!input || typeof input !== "string") {
        return { isValid: true }
    }

    const result = detectSqlInjection(input)

    if (result.detected) {
        return {
            isValid: false,
            error: `${fieldName} contains suspicious SQL patterns and has been rejected for security reasons`,
        }
    }

    return { isValid: true }
}

/**
 * Validates all registration form fields against SQL injection
 * Requirement 7.5, 11.1, 11.2, 11.3
 *
 * @param data - Object containing name, email, password, confirmPassword
 * @returns Object with isValid boolean and errors object with field-specific errors
 *
 * @example
 * validateRegistrationFormAgainstSqlInjection({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'ValidPass123!',
 *   confirmPassword: 'ValidPass123!'
 * })
 * // { isValid: true, errors: {} }
 */
export function validateRegistrationFormAgainstSqlInjection(data: {
    name: string
    email: string
    password: string
    confirmPassword: string
}): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    // Validate name
    const nameValidation = validateAgainstSqlInjection(data.name, "name")
    if (!nameValidation.isValid) {
        errors.name = nameValidation.error || "Invalid name"
    }

    // Validate email
    const emailValidation = validateAgainstSqlInjection(data.email, "email")
    if (!emailValidation.isValid) {
        errors.email = emailValidation.error || "Invalid email"
    }

    // Validate password
    const passwordValidation = validateAgainstSqlInjection(
        data.password,
        "password"
    )
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.error || "Invalid password"
    }

    // Validate confirmPassword
    const confirmPasswordValidation = validateAgainstSqlInjection(
        data.confirmPassword,
        "confirmPassword"
    )
    if (!confirmPasswordValidation.isValid) {
        errors.confirmPassword =
            confirmPasswordValidation.error || "Invalid confirmPassword"
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    }
}

/**
 * Validates all login form fields against SQL injection
 * Requirement 7.5, 11.1, 11.2, 11.3
 *
 * @param data - Object containing email and password
 * @returns Object with isValid boolean and errors object with field-specific errors
 *
 * @example
 * validateLoginFormAgainstSqlInjection({
 *   email: 'john@example.com',
 *   password: 'ValidPass123!'
 * })
 * // { isValid: true, errors: {} }
 */
export function validateLoginFormAgainstSqlInjection(data: {
    email: string
    password: string
}): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    // Validate email
    const emailValidation = validateAgainstSqlInjection(data.email, "email")
    if (!emailValidation.isValid) {
        errors.email = emailValidation.error || "Invalid email"
    }

    // Validate password
    const passwordValidation = validateAgainstSqlInjection(
        data.password,
        "password"
    )
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.error || "Invalid password"
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    }
}
