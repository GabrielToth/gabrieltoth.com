"use client"

/**
 * Settings Tab Page
 * Displays user settings and configuration options
 * Includes profile, preferences, security, billing, and integrations
 */
export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="mt-2 text-gray-600">
                    Manage your profile, preferences, security, and
                    integrations.
                </p>
            </div>

            {/* Placeholder for SettingsContainer component */}
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500">
                    Settings management coming soon...
                </p>
            </div>
        </div>
    )
}
