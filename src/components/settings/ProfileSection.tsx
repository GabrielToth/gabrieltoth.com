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
import React, { useState } from "react"
import { User } from "./SettingsContainer"

/**
 * ProfileSectionProps
 */
export interface ProfileSectionProps {
    user: User
    onSave: (user: User) => void
    isLoading?: boolean
    error?: string | null
}

/**
 * Form validation errors
 */
interface FormErrors {
    name?: string
    email?: string
}

/**
 * ProfileSection Component
 * User profile management (Name, Email, Profile Photo)
 * Form validation
 * Save functionality
 *
 * Features:
 * - Edit user name
 * - Edit user email
 * - Upload/change profile photo
 * - Form validation
 * - Save functionality
 * - Error handling
 */
export const ProfileSection: React.FC<ProfileSectionProps> = ({
    user,
    onSave,
    isLoading = false,
    error = null,
}) => {
    // Form state
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto || "",
    })
    const [errors, setErrors] = useState<FormErrors>({})
    const [isSaving, setIsSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")

    /**
     * Validate form data
     */
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        // Validate name
        if (!formData.name.trim()) {
            newErrors.name = "Name is required"
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters"
        }

        // Validate email
        if (!formData.email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    /**
     * Handle input change
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
        // Clear error for this field
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined,
            }))
        }
    }

    /**
     * Handle profile photo upload
     */
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // In production, upload to server
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    profilePhoto: reader.result as string,
                }))
            }
            reader.readAsDataURL(file)
        }
    }

    /**
     * Handle form submission
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setIsSaving(true)
            setSuccessMessage("")

            // Call onSave with updated user data
            const updatedUser: User = {
                ...user,
                name: formData.name,
                email: formData.email,
                profilePhoto: formData.profilePhoto,
                updatedAt: new Date(),
            }

            onSave(updatedUser)

            setSuccessMessage("Profile updated successfully!")
            setTimeout(() => setSuccessMessage(""), 3000)
        } catch (err) {
            setErrors({
                name:
                    err instanceof Error
                        ? err.message
                        : "Failed to save profile",
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                    Update your personal information and profile photo
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
                            {successMessage}
                        </div>
                    )}

                    {/* Profile Photo */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Profile Photo
                        </label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            {formData.profilePhoto && (
                                <img
                                    src={formData.profilePhoto}
                                    alt="Profile"
                                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="block w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:sm:px-4 file:py-2 file:text-xs file:sm:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </div>

                    {/* Name Field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Full Name
                        </label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter your full name"
                            disabled={isLoading || isSaving}
                            aria-invalid={!!errors.name}
                            aria-describedby={
                                errors.name ? "name-error" : undefined
                            }
                        />
                        {errors.name && (
                            <p id="name-error" className="text-sm text-red-600">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Email Address
                        </label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email address"
                            disabled={isLoading || isSaving}
                            aria-invalid={!!errors.email}
                            aria-describedby={
                                errors.email ? "email-error" : undefined
                            }
                        />
                        {errors.email && (
                            <p
                                id="email-error"
                                className="text-sm text-red-600"
                            >
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="submit"
                            disabled={isLoading || isSaving}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

export default ProfileSection
