import { type Locale } from "@/lib/i18n"
import { generateMetadata } from "./channel-management-metadata"
import ChannelManagementView from "./channel-management-view"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata }

export default async function ChannelManagementPage({ params }: PageProps) {
    const { locale } = await params
    return <ChannelManagementView locale={locale} />
}
