import { permanentRedirect } from "next/navigation"

export default function ChannelManagementRedirect() {
    // SEO: use a single permanent canonical for the non-locale route
    permanentRedirect("/en/channel-management")
}
