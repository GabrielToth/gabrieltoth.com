const createNextIntlPlugin = require("next-intl/plugin")

const withNextIntl = createNextIntlPlugin()

const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
    openAnalyzer: false,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Single DEBUG flag; exposed to the browser as NEXT_PUBLIC_DEBUG
    env: {
        NEXT_PUBLIC_DEBUG: process.env.DEBUG === "true" ? "true" : "false",
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Standalone output for minimal container size
    output: "standalone",
    trailingSlash: true,
    generateEtags: false,
    reactStrictMode: false,
    eslint: {
        ignoreDuringBuilds: false,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "10mb",
        },
    },
    // Performance optimizations
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
    // Compression and caching
    compress: true,
    poweredByHeader: false,
    webpack: (config, { dev, isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            }
        }
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
    // Headers for performance and security
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
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value:
                            "camera=(), microphone=(), geolocation=(), interest-cohort=()",
                    },
                    {
                        key: "Content-Security-Policy",
                        value:
                            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;",
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
    async rewrites() {
        return [
            // PT-BR rewrites - map translated URLs to English folder names
            {
                source: "/pt-BR/gerenciamento-de-canais/:path*/",
                destination: "/pt-BR/channel-management/:path*/",
            },
            {
                source: "/pt-BR/editores/:path*/",
                destination: "/pt-BR/editors/:path*/",
            },
            {
                source: "/pt-BR/otimizacao-de-pc/:path*/",
                destination: "/pt-BR/pc-optimization/:path*/",
            },
            {
                source: "/pt-BR/afiliados-amazon/:path*/",
                destination: "/pt-BR/amazon-affiliate/:path*/",
            },
            {
                source: "/pt-BR/politica-de-privacidade/:path*/",
                destination: "/pt-BR/privacy-policy/:path*/",
            },
            {
                source: "/pt-BR/termos-de-servico/:path*/",
                destination: "/pt-BR/terms-of-service/:path*/",
            },
            // PT-BR auth routes - handle both with and without trailing slash
            {
                source: "/pt-BR/entrar",
                destination: "/pt-BR/login",
            },
            {
                source: "/pt-BR/entrar/",
                destination: "/pt-BR/login/",
            },
            {
                source: "/pt-BR/registrar",
                destination: "/pt-BR/register",
            },
            {
                source: "/pt-BR/registrar/",
                destination: "/pt-BR/register/",
            },
            {
                source: "/pt-BR/pagamentos",
                destination: "/pt-BR/payments",
            },
            {
                source: "/pt-BR/pagamentos/",
                destination: "/pt-BR/payments/",
            },
            // ES rewrites - map translated URLs to English folder names
            {
                source: "/es/gestion-de-canales/:path*/",
                destination: "/es/channel-management/:path*/",
            },
            {
                source: "/es/editores/:path*/",
                destination: "/es/editors/:path*/",
            },
            {
                source: "/es/optimizacion-de-pc/:path*/",
                destination: "/es/pc-optimization/:path*/",
            },
            {
                source: "/es/afiliados-amazon/:path*/",
                destination: "/es/amazon-affiliate/:path*/",
            },
            {
                source: "/es/politica-de-privacidad/:path*/",
                destination: "/es/privacy-policy/:path*/",
            },
            {
                source: "/es/terminos-de-servicio/:path*/",
                destination: "/es/terms-of-service/:path*/",
            },
            // ES auth routes
            {
                source: "/es/iniciar-sesion",
                destination: "/es/login",
            },
            {
                source: "/es/iniciar-sesion/",
                destination: "/es/login/",
            },
            {
                source: "/es/registrarse",
                destination: "/es/register",
            },
            {
                source: "/es/registrarse/",
                destination: "/es/register/",
            },
            {
                source: "/es/pagos",
                destination: "/es/payments",
            },
            {
                source: "/es/pagos/",
                destination: "/es/payments/",
            },
            // DE rewrites - map translated URLs to English folder names
            {
                source: "/de/kanalverwaltung/:path*/",
                destination: "/de/channel-management/:path*/",
            },
            {
                source: "/de/editoren/:path*/",
                destination: "/de/editors/:path*/",
            },
            {
                source: "/de/pc-optimierung/:path*/",
                destination: "/de/pc-optimization/:path*/",
            },
            {
                source: "/de/amazon-partner/:path*/",
                destination: "/de/amazon-affiliate/:path*/",
            },
            {
                source: "/de/datenschutzrichtlinie/:path*/",
                destination: "/de/privacy-policy/:path*/",
            },
            {
                source: "/de/nutzungsbedingungen/:path*/",
                destination: "/de/terms-of-service/:path*/",
            },
            // DE auth routes
            {
                source: "/de/anmelden",
                destination: "/de/login",
            },
            {
                source: "/de/anmelden/",
                destination: "/de/login/",
            },
            {
                source: "/de/registrieren",
                destination: "/de/register",
            },
            {
                source: "/de/registrieren/",
                destination: "/de/register/",
            },
            {
                source: "/de/zahlungen",
                destination: "/de/payments",
            },
            {
                source: "/de/zahlungen/",
                destination: "/de/payments/",
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
                destination: "/pt-BR/gerenciamento-de-canais/",
                permanent: true,
            },
            {
                source: "/editors",
                destination: "/pt-BR/editores/",
                permanent: true,
            },
            {
                source: "/pc-optimization",
                destination: "/pt-BR/otimizacao-de-pc/",
                permanent: true,
            },
            {
                source: "/privacy-policy",
                destination: "/pt-BR/politica-de-privacidade/",
                permanent: true,
            },
            {
                source: "/terms-of-service",
                destination: "/pt-BR/termos-de-servico/",
                permanent: true,
            },
        ]
    },
}

module.exports = withBundleAnalyzer(withNextIntl(nextConfig))