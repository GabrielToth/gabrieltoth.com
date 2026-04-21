"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import React, { useState } from "react"
import { User } from "./SettingsContainer"

/**
 * SecuritySectionProps
 */
export interface SecuritySectionProps {
    user: User | null
}

/**
 * Password change form data
 */
interface PasswordFormData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

/**
 * Form validation errors
 */
interface FormErrors {
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
}

/**
 * SecuritySection Component
 * Security settings management
 * 2FA toggle (enable/disable)
 * Password change form
 * Password requirements display
 *
 * Features:
 * - Enable/disable 2FA
 * - Change password
 * - Password requirements validation
 * - Current password verification
 * - Error handling
 */
export const SecuritySection: React.FC<SecuritySectionProps> = ({ user }) => {
    // 2FA state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)

    // Password change state
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [passwordErrors, setPasswordErrors] = useState<FormErrors>({})
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState("")

    /**
     * Password requirements
     */
    const passwordRequirements = [
        { label: "At least 8 characters", regex: /.{8,}/ },
        { label: "At least one uppercase letter", regex: /[A-Z]/ },
        { label: "At least one lowercase letter", regex: /[a-z]/ },
        { label: "At least one number", regex: /\d/ },
        { label: "At least one special character", regex: /[!@#$%^&*]/ },
    ]

    /**
     * Check password requirements
     */
    const checkPasswordRequirements = (password: string) => {
        return passwordRequirements.map(req => ({
            ...req,
            met: req.regex.test(password),
        }))
    }

    /**
     * Validate password form
     */
    const validatePasswordForm = (): boolean => {
        const errors: FormErrors = {}

        if (!passwordForm.currentPassword) {
            errors.currentPassword = "Current password is required"
        }

        if (!passwordForm.newPassword) {
            errors.newPassword = "New password is required"
        } else {
            const requirements = checkPasswordRequirements(
                passwordForm.newPassword
            )
            const allMet = requirements.every(req => req.met)
            if (!allMet) {
                errors.newPassword = "Password does not meet all requirements"
            }
        }

        if (!passwordForm.confirmPassword) {
            errors.confirmPassword = "Please confirm your password"
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            errors.confirmPassword = "Passwords do not match"
        }

        setPasswordErrors(errors)
        return Object.keys(errors).length === 0
    }

    /**
     * Handle password input change
     */
    const handlePasswordInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target
        setPasswordForm(prev => ({
            ...prev,
            [name]: value,
        }))
        // Clear error for this field
        if (passwordErrors[name as keyof FormErrors]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: undefined,
            }))
        }
    }

    /**
     * Handle password change submission
     */
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validatePasswordForm()) {
            return
        }

        try {
            setIsChangingPassword(true)
            setPasswordSuccess("")

            // TODO: Call API to change password
            // await changePassword(passwordForm)

            setPasswordSuccess("Password changed successfully!")
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })
            setShowPasswordForm(false)

            setTimeout(() => setPasswordSuccess(""), 3000)
        } catch (err) {
            setPasswordErrors({
                currentPassword:
                    err instanceof Error
                        ? err.message
                        : "Failed to change password",
            })
        } finally {
            setIsChangingPassword(false)
        }
    }

    /**
     * Handle 2FA toggle
     */
    const handleTwoFactorToggle = (checked: boolean) => {
        if (checked) {
            setShowTwoFactorSetup(true)
        } else {
            setTwoFactorEnabled(false)
            setShowTwoFactorSetup(false)
        }
    }

    /**
     * Handle 2FA setup confirmation
     */
    const handleTwoFactorSetup = () => {
        // TODO: Implement 2FA setup flow
        setTwoFactorEnabled(true)
        setShowTwoFactorSetup(false)
    }

    const passwordRequirementsMet = checkPasswordRequirements(
        passwordForm.newPassword
    )

    return (
        <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <Card>
                <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                        Add an extra layer of security to your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">
                                {twoFactorEnabled
                                    ? "2FA Enabled"
                                    : "2FA Disabled"}
                            </p>
                            <p className="text-sm text-gray-600">
                                {twoFactorEnabled
                                    ? "Your account is protected with two-factor authentication"
                                    : "Enable 2FA to secure your account"}
                            </p>
                        </div>
                        <Toggle
                            pressed={twoFactorEnabled}
                            onPressedChange={handleTwoFactorToggle}
                            aria-label="Toggle 2FA"
                        >
                            {twoFactorEnabled ? "On" : "Off"}
                        </Toggle>
                    </div>

                    {/* 2FA Setup Instructions */}
                    {showTwoFactorSetup && !twoFactorEnabled && (
                        <div className="space-y-4 rounded-lg bg-blue-50 p-4">
                            <p className="text-sm font-medium text-blue-900">
                                Set up Two-Factor Authentication
                            </p>
                            <ol className="space-y-2 text-sm text-blue-800">
                                <li>
                                    1. Download an authenticator app (Google
                                    Authenticator, Authy, etc.)
                                </li>
                                <li>
                                    2. Scan the QR code below with your
                                    authenticator app
                                </li>
                                <li>
                                    3. Enter the 6-digit code from your app to
                                    confirm
                                </li>
                            </ol>
                            <div className="flex justify-center rounded-lg bg-white p-4">
                                <div className="h-32 w-32 bg-gray-200" />
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="2fa-code"
                                    className="block text-sm font-medium text-blue-900"
                                >
                                    Enter 6-digit code
                                </label>
                                <Input
                                    id="2fa-code"
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    className="text-center text-2xl tracking-widest"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowTwoFactorSetup(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleTwoFactorSetup}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Confirm & Enable
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                        Change your password to keep your account secure
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {passwordSuccess && (
                        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
                            {passwordSuccess}
                        </div>
                    )}

                    {!showPasswordForm ? (
                        <Button
                            onClick={() => setShowPasswordForm(true)}
                            variant="outline"
                        >
                            Change Password
                        </Button>
                    ) : (
                        <form
                            onSubmit={handlePasswordSubmit}
                            className="space-y-4"
                        >
                            {/* Current Password */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="currentPassword"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Current Password
                                </label>
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder="Enter your current password"
                                    disabled={isChangingPassword}
                                    aria-invalid={
                                        !!passwordErrors.currentPassword
                                    }
                                    aria-describedby={
                                        passwordErrors.currentPassword
                                            ? "currentPassword-error"
                                            : undefined
                                    }
                                />
                                {passwordErrors.currentPassword && (
                                    <p
                                        id="currentPassword-error"
                                        className="text-sm text-red-600"
                                    >
                                        {passwordErrors.currentPassword}
                                    </p>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="newPassword"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    New Password
                                </label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder="Enter your new password"
                                    disabled={isChangingPassword}
                                    aria-invalid={!!passwordErrors.newPassword}
                                    aria-describedby={
                                        passwordErrors.newPassword
                                            ? "newPassword-error"
                                            : undefined
                                    }
                                />
                                {passwordErrors.newPassword && (
                                    <p
                                        id="newPassword-error"
                                        className="text-sm text-red-600"
                                    >
                                        {passwordErrors.newPassword}
                                    </p>
                                )}

                                {/* Password Requirements */}
                                {passwordForm.newPassword && (
                                    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                                        <p className="text-xs font-medium text-gray-700">
                                            Password Requirements:
                                        </p>
                                        <ul className="space-y-1">
                                            {passwordRequirementsMet.map(
                                                (req, idx) => (
                                                    <li
                                                        key={idx}
                                                        className={`text-xs ${
                                                            req.met
                                                                ? "text-green-600"
                                                                : "text-gray-600"
                                                        }`}
                                                    >
                                                        {req.met ? "✓" : "○"}{" "}
                                                        {req.label}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Confirm Password
                                </label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder="Confirm your new password"
                                    disabled={isChangingPassword}
                                    aria-invalid={
                                        !!passwordErrors.confirmPassword
                                    }
                                    aria-describedby={
                                        passwordErrors.confirmPassword
                                            ? "confirmPassword-error"
                                            : undefined
                                    }
                                />
                                {passwordErrors.confirmPassword && (
                                    <p
                                        id="confirmPassword-error"
                                        className="text-sm text-red-600"
                                    >
                                        {passwordErrors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowPasswordForm(false)
                                        setPasswordForm({
                                            currentPassword: "",
                                            newPassword: "",
                                            confirmPassword: "",
                                        })
                                        setPasswordErrors({})
                                    }}
                                    disabled={isChangingPassword}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isChangingPassword
                                        ? "Changing..."
                                        : "Change Password"}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default SecuritySection
