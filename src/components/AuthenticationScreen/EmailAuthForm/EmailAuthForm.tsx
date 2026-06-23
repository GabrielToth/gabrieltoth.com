import React, { useState } from "react"
import styles from "./EmailAuthForm.module.css"

interface EmailAuthFormProps {
    onSubmit: (email: string, password: string) => void
    onBack: () => void
    isLoading?: boolean
    error?: string | null
}

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({
    onSubmit,
    onBack,
    isLoading,
    error,
}) => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [validationError, setValidationError] = useState<string | null>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setValidationError(null)
        if (!email.trim()) {
            setValidationError("Email is required")
            return
        }
        if (!password) {
            setValidationError("Password is required")
            return
        }
        onSubmit(email, password)
    }

    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            {error && <div className={styles.error}>{error}</div>}
            {validationError && (
                <div className={styles.error}>{validationError}</div>
            )}
            <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder="your@email.com"
                    autoComplete="email"
                />
            </div>
            <div className={styles.field}>
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                />
            </div>
            <div className={styles.actions}>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={styles.submitButton}
                >
                    {isLoading ? "Signing in..." : "Sign In"}
                </button>
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isLoading}
                    className={styles.backButton}
                >
                    Back
                </button>
            </div>
        </form>
    )
}
