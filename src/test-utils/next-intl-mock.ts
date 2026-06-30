/**
 * Shared next-intl mock factory for tests
 * Provides English-like text for translation keys
 */

type TranslationMap = Record<string, string>

const publishMocks: TranslationMap = {
    title: "Publish",
    description: "Manage and schedule your social media posts",
    postCount: "Showing {shown} of {total} posts",
    filterByChannel: "Filter by Channel",
    filtersApplied: "{count} filters applied",
    clearAllFilters: "Clear all filters",
    noConnectedChannels: "No connected channels available",
    createContent: "Create Content",
    contentDescription: "Write your post content below",
    content: "Post content",
    whatsOnYourMind: "What's on your mind?",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    link: "Link",
    characters: "{count} / {limit} characters",
    exceedsLimit: "Exceeds platform limit",
    images: "Upload images",
    uploadImages: "Upload images",
    delete: "Delete",
    addUrls: "Add URLs",
    add: "Add",
    saveAsDraft: "Save as draft",
    edit: "Edit",
    published: "Published",
    scheduled: "Scheduled",
    error: "Error: ",
    cannotEditPublished: "Cannot edit published posts",
    errorLoading: "Error loading posts",
    retry: "Retry",
    noPostsFound: "No posts found",
    createFirstPost: "Create your first post",
    linkNetworksFirst: "Link social networks first to start posting",
    postToNetworks: "Post to {count} networks",
    networksLinked: "{count} networks linked",
    post: "Post",
}

const settingsMocks: TranslationMap = {
    currentPlan: "Current Plan",
    planDescription: "Manage your subscription and billing",
    planValue: "{plan} Plan",
    plan: "Pro Plan",
    youAreOnPlan: "You are on the {plan} plan",
    perMonth: "/month",
    planIncludes: "Plan includes",
    unlimitedPosts: "Unlimited posts",
    connectedChannels: "{count} connected channels",
    basicAnalytics: "Basic analytics",
    emailSupport: "Email support",
    nextBillingDate: "Next billing date:",
    upgradePlan: "Upgrade Plan",
    billingHistory: "Billing History",
    billingHistoryDescription: "View and download your past invoices",
    date: "Date",
    amount: "Amount",
    status: "Status",
    action: "Action",
    downloading: "Downloading...",
    download: "Download",
    noInvoices: "No invoices yet. Your first invoice will appear here.",
    integrations: "Integrations",
    integrationsDescription: "Connect third-party apps to extend functionality",
    connectedApps: "{count} apps connected",
    connectedOn: "Connected on",
    connected: "Connected",
    cancel: "Cancel",
    disconnecting: "Disconnecting...",
    confirma: "Confirm",
    disconnect: "Disconnect",
    availableApps: "{count} available apps",
    notConnected: "Not Connected",
    available: "Available",
    addIntegration: "Add Integration",
    preferences: "Preferences",
    notifications: "Notifications",
    notificationsDescription:
        "Receive email notifications about your account activity",
    toggleNotifications: "Toggle notifications",
    on: "On",
    off: "Off",
    language: "Language",
    selectLanguage: "Select language",
    languageEnglish: "English",
    languagePortuguese: "Portuguese",
    languageSpanish: "Spanish",
    languageFrench: "French",
    languageDescription: "Choose your preferred language",
    theme: "Theme",
    selectTheme: "Select theme",
    light: "Light",
    dark: "Dark",
    autoTheme: "Auto (System)",
    themeDescription: "Choose your preferred theme",
    timezone: "Timezone",
    selectTimezone: "Select timezone",
    timezoneDescription: "Choose your timezone",
    preferencesSavedAutomatically:
        "Your preferences are saved automatically when you make changes.",
    profileInformation: "Profile Information",
    profileDescription: "Update your profile information",
    profilePhoto: "Profile Photo",
    fullName: "Full Name",
    emailAddress: "Email Address",
    enterFullName: "Enter your full name",
    enterEmail: "Enter your email",
    saveChanges: "Save Changes",
    saving: "Saving...",
    nameRequired: "Name is required",
    nameMinLength: "Name must be at least 2 characters",
    emailRequired: "Email is required",
    emailValid: "Please enter a valid email",
    profileUpdated: "Profile updated successfully!",
    failedToSaveProfile: "Failed to save profile",
    toggleSidebar: "Toggle sidebar",
    closeSidebar: "Close sidebar",
    dashboard: "Dashboard",
    organization: "Organization",
    myOrganization: "My Organization",
    mainNavigation: "Main navigation",
}

const dashboardMocks: TranslationMap = {
    "youtube.connectYouTube": "Connect YouTube",
    "youtube.connectedSince": "Connected since",
    "youtube.noChannel": "No YouTube channel connected",
    "youtube.connected": "Connected",
    "youtube.cancel": "Cancel",
    "youtube.disconnecting": "Disconnecting...",
    "youtube.confirmDisconnect": "Confirm disconnect",
    "youtube.disconnect": "Disconnect",
    "youtube.connecting": "Connecting...",
    "youtube.connect": "Connect",
    "youtube.notConnected": "Not Connected",
}

/**
 * Create a next-intl mock for the given namespace
 */
export function createTranslationsMock(ns: string) {
    const mockFn = (key: string, params?: Record<string, string | number>) => {
        const map: TranslationMap =
            ns === "dashboard.publish"
                ? publishMocks
                : ns === "dashboard.settings"
                  ? settingsMocks
                  : ns === "dashboard"
                    ? dashboardMocks
                    : {}

        let value = map[key] ?? key
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                value = value.replace(`{${k}}`, String(v))
            }
        }
        return value
    }
    mockFn.raw = () => []
    mockFn.rich = (key: string) => mockFn(key)
    return mockFn
}
