const createNextIntlPlugin = require("next-intl/plugin")

const withNextIntl = createNextIntlPlugin()

const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_DEBUG: process.env.DEBUG === "true" ? "true" : "false",
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    output: "standalone",
    eslint: {
        ignoreDuringBuilds: false,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "10mb",
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "**.ggpht.com",
            },
            {
                protocol: "https",
                hostname: "i.ytimg.com",
            },
            {
                protocol: "https",
                hostname: "yt3.ggpht.com",
            },
            {
                protocol: "https",
                hostname: "**.twitch.tv",
            },
            {
                protocol: "https",
                hostname: "static-cdn.jtvnw.net",
            },
            {
                protocol: "https",
                hostname: "**.kick.com",
            },
            {
                protocol: "https",
                hostname: "images.kick.com",
            },
            {
                protocol: "https",
                hostname: "**.facebook.com",
            },
            {
                protocol: "https",
                hostname: "graph.facebook.com",
            },
            {
                protocol: "https",
                hostname: "**.fbcdn.net",
            },
            {
                protocol: "https",
                hostname: "scontent.xx.fbcdn.net",
            },
            {
                protocol: "https",
                hostname: "**.cdninstagram.com",
            },
            {
                protocol: "https",
                hostname: "scontent.cdninstagram.com",
            },
            {
                protocol: "https",
                hostname: "**.twimg.com",
            },
            {
                protocol: "https",
                hostname: "pbs.twimg.com",
            },
            {
                protocol: "https",
                hostname: "abs.twimg.com",
            },
            {
                protocol: "https",
                hostname: "**.tiktokcdn.com",
            },
            {
                protocol: "https",
                hostname: "p16-sign-sg.tiktokcdn.com",
            },
            {
                protocol: "https",
                hostname: "**.byteoversea.com",
            },
            {
                protocol: "https",
                hostname: "p16.tiktokcdn.com",
            },
            {
                protocol: "https",
                hostname: "**.githubusercontent.com",
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
            },
            {
                protocol: "https",
                hostname: "**.discordapp.com",
            },
            {
                protocol: "https",
                hostname: "cdn.discordapp.com",
            },
            {
                protocol: "https",
                hostname: "**.discord.com",
            },
            {
                protocol: "https",
                hostname: "images-ext-1.discordapp.net",
            },
        ],
        formats: ["image/avif", "image/webp"],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60,
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            }
        }
        return config
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
        ]
    },
}

module.exports = withBundleAnalyzer(withNextIntl(nextConfig))
