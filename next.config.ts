import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin()

// Bundle analyzer configuration
const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false,
})

const nextConfig: NextConfig = {
    trailingSlash: true,
    generateEtags: false,
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
            // Explicit content-type for XML and robots
            {
                source: "/sitemap.xml",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/xml; charset=utf-8",
                    },
                    { key: "Cache-Control", value: "no-store" },
                ],
            },
            {
                source: "/sitemap-en.xml",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/xml; charset=utf-8",
                    },
                    { key: "Cache-Control", value: "no-store" },
                ],
            },
            {
                source: "/sitemap-pt-BR.xml",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/xml; charset=utf-8",
                    },
                    { key: "Cache-Control", value: "no-store" },
                ],
            },
            {
                source: "/sitemap-es.xml",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/xml; charset=utf-8",
                    },
                    { key: "Cache-Control", value: "no-store" },
                ],
            },
            {
                source: "/sitemap-de.xml",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/xml; charset=utf-8",
                    },
                    { key: "Cache-Control", value: "no-store" },
                ],
            },
            {
                source: "/robots.txt",
                headers: [
                    { key: "Content-Type", value: "text/plain; charset=utf-8" },
                    { key: "Cache-Control", value: "no-store" },
                ],
            },
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
    async redirects() {
        return [
            // Canonicalize apex to www (preserve path)
            {
                source: "/:path*",
                has: [
                    {
                        type: "host",
                        value: "gabrieltoth.com",
                    },
                ],
                destination: "https://www.gabrieltoth.com/:path*",
                permanent: true,
            },
            // Legacy resume URLs -> unified PT-BR PDF asset
            {
                source: "/resume/Gabriel",
                destination: "/resume/Gabriel_Toth_Curriculum_PT.pdf",
                permanent: true,
            },
            {
                source: "/resume/Gabriel%20Toth%20-%20Curriculum%20PT.pdf",
                destination: "/resume/Gabriel_Toth_Curriculum_PT.pdf",
                permanent: true,
            },
            {
                source: "/resume/Gabriel%20Toth%20-%20Curriculum%20EN.pdf",
                destination: "/resume/Gabriel_Toth_Curriculum_ENpdf",
                permanent: true,
            },
            // Locale-prefixed canonical routes (static known paths)
            {
                source: "/",
                destination: "/pt-BR/",
                permanent: true,
            },
            {
                source: "/channel-management",
                destination: "/pt-BR/channel-management/",
                permanent: true,
            },
            {
                source: "/editors",
                destination: "/pt-BR/editors/",
                permanent: true,
            },
            {
                source: "/pc-optimization",
                destination: "/pt-BR/pc-optimization/",
                permanent: true,
            },
            {
                source: "/privacy-policy",
                destination: "/pt-BR/privacy-policy/",
                permanent: true,
            },
            {
                source: "/terms-of-service",
                destination: "/pt-BR/terms-of-service/",
                permanent: true,
            },
        ]
    },
}

export default withBundleAnalyzer(withNextIntl(nextConfig))
