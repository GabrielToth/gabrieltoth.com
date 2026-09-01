/**
 * Step 1: Pre-filled Data Component
 *
 * Displays pre-filled data from OAuth provider and allows editing.
 * Shows email, name, and profile picture.
 *
 * Validates: Requirements 3.3, 3.4, 4.4, 4.5
 */

"use client"

import { useTranslations } from "next-intl"
import { useCallback, useState } from "react"
import FieldEditor from "../components/field-editor"

interface Step1PrefilledProps {
    prefilledData: {
        email: string
        name: string
        picture?: string
    }
    editedData: {
        email: string
        name: string
        picture?: string
    }
    errors: Record<string, string>
    onUpdateField: (field: "email" | "name", value: string) => void
    onPictureChange?: (picture: string | undefined) => void
    onContinue: () => void
    isLoading?: boolean
}

export default function Step1Prefilled({
    prefilledData,
    editedData,
    errors,
    onUpdateField,
    onPictureChange,
    onContinue,
    isLoading = false,
}: Step1PrefilledProps) {
    const t = useTranslations("auth")
    const [editingField, setEditingField] = useState<"email" | "name" | null>(
        null
    )
    const [pictureInput, setPictureInput] = useState(
        editedData.picture ?? prefilledData.picture ?? ""
    )
    const [isPictureEditing, setIsPictureEditing] = useState(false)

    const handleEditField = useCallback((field: "email" | "name") => {
        setEditingField(field)
    }, [])

    const handleSaveField = useCallback(
        (field: "email" | "name", value: string) => {
            onUpdateField(field, value)
            setEditingField(null)
        },
        [onUpdateField]
    )

    const handleSavePicture = useCallback(() => {
        const trimmed = pictureInput.trim()
        const hasUrl =
            trimmed.startsWith("http://") || trimmed.startsWith("https://")
        onPictureChange?.(hasUrl ? trimmed : undefined)
        setIsPictureEditing(false)
    }, [onPictureChange, pictureInput])

    const handleRemovePicture = useCallback(() => {
        setPictureInput("")
        onPictureChange?.(undefined)
        setIsPictureEditing(true)
    }, [onPictureChange])

    const handleCancelEdit = useCallback(() => {
        setEditingField(null)
    }, [])

    return (
        <div className="space-y-6">
            {/* Step Title */}
            <div>
                <h2 className="text-2xl font-bold text-foreground dark:text-foreground mb-2">
                    {t("completeAccount.step1.title")}
                </h2>
                <p className="text-muted-foreground dark:text-muted-foreground">
                    {t("completeAccount.step1.description")}
                </p>
            </div>

            {/* Profile Picture — double as the optional photo confirmation */}
            <div className="flex flex-col items-center gap-3">
                {(editedData.picture || prefilledData.picture) &&
                !isPictureEditing ? (
                    <>
                        <img
                            src={editedData.picture || prefilledData.picture}
                            alt={prefilledData.name}
                            className="w-24 h-24 rounded-full border-4 dark:border-white/10 dark:border-border object-cover"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsPictureEditing(true)}
                                className="text-xs text-primary hover:text-primary/80 font-medium"
                            >
                                {t("completeAccount.step1.changePicture")}
                            </button>
                            <button
                                type="button"
                                onClick={handleRemovePicture}
                                className="text-xs text-destructive hover:text-destructive/80 font-medium"
                            >
                                {t("completeAccount.step1.removePicture")}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {editedData.picture || prefilledData.picture ? (
                            <img
                                src={
                                    editedData.picture || prefilledData.picture
                                }
                                alt={prefilledData.name}
                                className="w-24 h-24 rounded-full border-4 dark:border-white/10 dark:border-border object-cover opacity-60"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full border-4 dark:border-white/10 dark:border-border bg-muted flex items-center justify-center text-muted-foreground">
                                {(prefilledData.name || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                        )}
                        <input
                            type="url"
                            value={pictureInput}
                            onChange={e => setPictureInput(e.target.value)}
                            placeholder={t(
                                "completeAccount.step1.picturePlaceholder"
                            )}
                            className="w-full max-w-sm px-3 py-2 text-sm border border-border rounded-md bg-background dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleSavePicture}
                                className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {t("completeAccount.step1.confirmPicture")}
                            </button>
                            {prefilledData.picture && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPictureInput(
                                            prefilledData.picture || ""
                                        )
                                        setEditingField(null)
                                        setIsPictureEditing(false)
                                        onPictureChange?.(prefilledData.picture)
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted"
                                >
                                    {t("completeAccount.step1.keepPicture")}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
                {/* Email Field */}
                {editingField === "email" ? (
                    <FieldEditor
                        label={t("completeAccount.step1.email")}
                        value={editedData.email}
                        placeholder={t(
                            "completeAccount.step1.emailPlaceholder"
                        )}
                        type="email"
                        error={errors.email}
                        onSave={value => handleSaveField("email", value)}
                        onCancel={handleCancelEdit}
                        isLoading={isLoading}
                    />
                ) : (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground dark:text-foreground">
                            {t("completeAccount.step1.email")}
                        </label>
                        <div className="flex items-center justify-between gap-2 p-3 bg-muted dark:bg-card rounded-md border border-border dark:border-border">
                            <span className="text-foreground dark:text-foreground">
                                {editedData.email}
                            </span>
                            <button
                                onClick={() => handleEditField("email")}
                                className="text-primary dark:text-primary hover:text-primary dark:hover:text-primary text-sm font-medium"
                            >
                                {t("completeAccount.step1.edit")}
                            </button>
                        </div>
                        {errors.email && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {t(`completeAccount.errors.${errors.email}`)}
                            </p>
                        )}
                    </div>
                )}

                {/* Name Field */}
                {editingField === "name" ? (
                    <FieldEditor
                        label={t("completeAccount.step1.name")}
                        value={editedData.name}
                        placeholder={t("completeAccount.step1.namePlaceholder")}
                        error={errors.name}
                        onSave={value => handleSaveField("name", value)}
                        onCancel={handleCancelEdit}
                        isLoading={isLoading}
                    />
                ) : (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground dark:text-foreground">
                            {t("completeAccount.step1.name")}
                        </label>
                        <div className="flex items-center justify-between gap-2 p-3 bg-muted dark:bg-card rounded-md border border-border dark:border-border">
                            <span className="text-foreground dark:text-foreground">
                                {editedData.name}
                            </span>
                            <button
                                onClick={() => handleEditField("name")}
                                className="text-primary dark:text-primary hover:text-primary dark:hover:text-primary text-sm font-medium"
                            >
                                {t("completeAccount.step1.edit")}
                            </button>
                        </div>
                        {errors.name && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {t(`completeAccount.errors.${errors.name}`)}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Continue Button */}
            <button
                onClick={onContinue}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-primary dark:bg-primary text-primary-foreground rounded-full hover:bg-primary dark:hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
                {isLoading
                    ? t("completeAccount.loading")
                    : t("completeAccount.step1.continue")}
            </button>
        </div>
    )
}
