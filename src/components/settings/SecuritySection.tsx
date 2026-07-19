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
import { useTranslations } from "next-intl"
import React, { useState } from "react"
import { User } from "./SettingsContainer"
import {
    changePassword,
    enableTwoFactor,
    disableTwoFactor,
} from "@/lib/api/user"

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const SecuritySection: React.FC<SecuritySectionProps> = ({ user }) => {
    const t = useTranslations("dashboard.settings")
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
        { label: t("passwordMinChars"), regex: /.{8,}/ },
        { label: t("passwordUppercase"), regex: /[A-Z]/ },
        { label: t("passwordLowercase"), regex: /[a-z]/ },
        { label: t("passwordNumber"), regex: /\d/ },
        { label: t("passwordSpecial"), regex: /[!@#$%^&*]/ },
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
            errors.currentPassword = t("currentPasswordRequired")
        }

        if (!passwordForm.newPassword) {
            errors.newPassword = t("newPasswordRequired")
        } else {
            const requirements = checkPasswordRequirements(
                passwordForm.newPassword
            )
            const allMet = requirements.every(req => req.met)
            if (!allMet) {
                errors.newPassword = t("passwordRequirementsNotMet")
            }
        }

        if (!passwordForm.confirmPassword) {
            errors.confirmPassword = t("confirmPasswordRequired")
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            errors.confirmPassword = t("passwordsDoNotMatch")
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

            await changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            )

            setPasswordSuccess(t("passwordChanged"))
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
                        : t("failedToChangePassword"),
            })
        } finally {
            setIsChangingPassword(false)
        }
    }

    /**
     * Handle 2FA toggle
     */
    const handleTwoFactorToggle = async (checked: boolean) => {
        if (checked) {
            setShowTwoFactorSetup(true)
        } else {
            await disableTwoFactor()
            setTwoFactorEnabled(false)
            setShowTwoFactorSetup(false)
        }
    }

    /**
     * Handle 2FA setup confirmation
     */
    const handleTwoFactorSetup = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const result = await enableTwoFactor()
            setTwoFactorEnabled(true)
            setShowTwoFactorSetup(false)
        } catch (err) {
            console.error("Failed to enable 2FA:", err)
        }
    }

    const passwordRequirementsMet = checkPasswordRequirements(
        passwordForm.newPassword
    )

    return (
        <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("twoFactorAuthentication")}</CardTitle>
                    <CardDescription>
                        {t("twoFactorDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-foreground dark:text-foreground">
                                {twoFactorEnabled
                                    ? t("twoFactorEnabled")
                                    : t("twoFactorDisabled")}
                            </p>
                            <p className="text-sm text-muted-foreground dark:text-foreground">
                                {twoFactorEnabled
                                    ? t("twoFactorProtected")
                                    : t("twoFactorEnablePrompt")}
                            </p>
                        </div>
                        <Toggle
                            pressed={twoFactorEnabled}
                            onPressedChange={handleTwoFactorToggle}
                            aria-label={t("toggle2FA")}
                        >
                            {twoFactorEnabled ? t("on") : t("off")}
                        </Toggle>
                    </div>

                    {/* 2FA Setup Instructions */}
                    {showTwoFactorSetup && !twoFactorEnabled && (
                        <div className="space-y-4 rounded-lg bg-primary/5 p-4 dark:bg-primary/10">
                            <p className="text-sm font-medium text-primary dark:text-primary">
                                {t("setup2FA")}
                            </p>
                            <ol className="space-y-2 text-sm text-primary dark:text-primary">
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
                            <div className="flex justify-center rounded-lg bg-white p-4 dark:bg-card">
                                <div className="h-32 w-32 bg-accent dark:bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <label
                                    htmlFor="2fa-code"
                                    className="block text-sm font-medium text-primary dark:text-primary"
                                >
                                    {t("enter6DigitCode")}
                                </label>
                                <Input
                                    id="2fa-code"
                                    type="text"
                                    placeholder={t("codePlaceholder")}
                                    maxLength={6}
                                    className="text-center text-2xl tracking-widest"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowTwoFactorSetup(false)}
                                >
                                    {t("cancel")}
                                </Button>
                                <Button
                                    onClick={handleTwoFactorSetup}
                                    className="bg-primary hover:bg-primary"
                                >
                                    {t("confirmAndEnable")}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("changePassword")}</CardTitle>
                    <CardDescription>
                        {t("changePasswordDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {passwordSuccess && (
                        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {passwordSuccess}
                        </div>
                    )}

                    {!showPasswordForm ? (
                        <Button
                            onClick={() => setShowPasswordForm(true)}
                            variant="outline"
                        >
                            {t("changePassword")}
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
                                    className="block text-sm font-medium text-foreground dark:text-foreground"
                                >
                                    {t("currentPassword")}
                                </label>
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder={t("enterCurrentPassword")}
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
                                        className="text-sm text-red-600 dark:text-red-400"
                                    >
                                        {passwordErrors.currentPassword}
                                    </p>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="newPassword"
                                    className="block text-sm font-medium text-foreground dark:text-foreground"
                                >
                                    {t("newPassword")}
                                </label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder={t("enterNewPassword")}
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
                                        className="text-sm text-red-600 dark:text-red-400"
                                    >
                                        {passwordErrors.newPassword}
                                    </p>
                                )}

                                {/* Password Requirements */}
                                {passwordForm.newPassword && (
                                    <div className="space-y-2 rounded-lg bg-muted p-3 dark:bg-background/50">
                                        <p className="text-xs font-medium text-foreground dark:text-foreground">
                                            {t("passwordRequirements")}:
                                        </p>
                                        <ul className="space-y-1">
                                            {passwordRequirementsMet.map(
                                                (req, idx) => (
                                                    <li
                                                        key={idx}
                                                        className={`text-xs ${
                                                            req.met
                                                                ? "text-green-600 dark:text-green-400"
                                                                : "text-muted-foreground dark:text-muted-foreground"
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
                                    className="block text-sm font-medium text-foreground dark:text-foreground"
                                >
                                    {t("confirmPassword")}
                                </label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordInputChange}
                                    placeholder={t("confirmNewPassword")}
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
                                        className="text-sm text-red-600 dark:text-red-400"
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
                                    {t("cancel")}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="bg-primary hover:bg-primary"
                                >
                                    {isChangingPassword
                                        ? t("changing")
                                        : t("changePassword")}
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
