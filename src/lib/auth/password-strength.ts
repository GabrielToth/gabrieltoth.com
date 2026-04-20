/**
 * Password Strength Indicator
 * Provides password strength calculation for real-time feedback
 * Validates: Requirements 8.2
 */

export type PasswordStrength = "weak" | "fair" | "good" | "strong"

export interface PasswordStrengthResult {
    strength: PasswordStrength
    score: number // 0-4
    feedback: string
    color: string // Tailwind color class
}

/**
 * Calculate password strength based on various criteria
 * Requirement 8.2
 *
 * @param password - The password to evaluate
 * @returns PasswordStrengthResult with strength level, score, feedback, and color
 *
 * @example
 * calculatePasswordStrength('weak') // { strength: 'weak', score: 0, feedback: '...', color: 'text-red-500' }
 * calculatePasswordStrength('ValidPass123!') // { strength: 'strong', score: 4, feedback: '...', color: 'text-green-500' }
 */
export function calculatePasswordStrength(
    password: string
): PasswordStrengthResult {
    if (!password || typeof password !== "string") {
        return {
            strength: "weak",
            score: 0,
            feedback: "Password is required",
            color: "text-red-500",
        }
    }

    let score = 0
    const checks = {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
    }

    // Check length (minimum 8 characters)
    if (password.length >= 8) {
        score++
        checks.length = true
    }

    // Check for uppercase letter
    if (/[A-Z]/.test(password)) {
        score++
        checks.uppercase = true
    }

    // Check for lowercase letter
    if (/[a-z]/.test(password)) {
        score++
        checks.lowercase = true
    }

    // Check for number
    if (/[0-9]/.test(password)) {
        score++
        checks.number = true
    }

    // Check for special character
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        score++
        checks.special = true
    }

    // Bonus points for longer passwords
    if (password.length >= 12) {
        score += 0.5
    }
    if (password.length >= 16) {
        score += 0.5
    }

    // Determine strength level
    let strength: PasswordStrength
    let feedback: string
    let color: string

    if (score < 2) {
        strength = "weak"
        feedback = "Too weak - add more character types"
        color = "text-red-500"
    } else if (score < 3) {
        strength = "fair"
        feedback = "Fair - add more character types"
        color = "text-orange-500"
    } else if (score < 5) {
        strength = "good"
        feedback = "Good password"
        color = "text-yellow-500"
    } else {
        strength = "strong"
        feedback = "Strong password"
        color = "text-green-500"
    }

    return {
        strength,
        score: Math.min(Math.floor(score), 4),
        feedback,
        color,
    }
}

/**
 * Get missing requirements for password strength
 * Requirement 8.2
 *
 * @param password - The password to evaluate
 * @returns Array of missing requirements
 *
 * @example
 * getMissingRequirements('weak') // ['At least 8 characters', 'Uppercase letter', ...]
 */
export function getMissingRequirements(password: string): string[] {
    const missing: string[] = []

    if (!password || password.length < 8) {
        missing.push("At least 8 characters")
    }

    if (!/[A-Z]/.test(password)) {
        missing.push("Uppercase letter (A-Z)")
    }

    if (!/[a-z]/.test(password)) {
        missing.push("Lowercase letter (a-z)")
    }

    if (!/[0-9]/.test(password)) {
        missing.push("Number (0-9)")
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        missing.push("Special character (!@#$%^&*)")
    }

    return missing
}
