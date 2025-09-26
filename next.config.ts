import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

// Bundle analyzer configuration
const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false,
})

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    reactStrictMode: false,
    experimental: {
        forceSwcTransforms: false,
        // optimizeCss: true, // Disabled temporarily due to critters dependency issue
    },
    // Performance optimizations
    images: {
        formats: ["image/webp", "image/avif"],
        minimumCacheTTL: 60,
    },
    // Webpack optimizations
    webpack: (config, { dev, isServer }) => {
        // Bundle splitting optimizations
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    ...config.optimization.splitChunks,
                    cacheGroups: {
                        ...config.optimization.splitChunks?.cacheGroups,
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: "vendors",
                            chunks: "all",
                            enforce: true,
                        },
                        common: {
                            name: "common",
                            minChunks: 2,
                            chunks: "all",
                            enforce: true,
                        },
                    },
                },
            }
        }

        // Performance optimizations
        config.resolve.alias = {
            ...config.resolve.alias,
            // Add any aliases for better tree shaking
        }

        return config
    },
    // Compression and caching
    compress: true,
    poweredByHeader: false,
    // Headers for performance
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                ],
            },
            {
                source: "/(.*)\\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|avif)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
        ]
    },
}

export default withBundleAnalyzer(withNextIntl(nextConfig))
