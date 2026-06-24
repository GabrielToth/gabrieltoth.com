import DashboardClientLayout from "./dashboard-layout-client"

/**
 * Dashboard Layout (Server Component)
 * Locale context is already provided by the parent [locale] layout
 */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <DashboardClientLayout>{children}</DashboardClientLayout>
}
