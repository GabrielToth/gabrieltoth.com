import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
    reactStrictMode: false,
    experimental: {
        forceSwcTransforms: false,
    },
}

export default withNextIntl(nextConfig)
