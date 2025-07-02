module.exports = {
    ci: {
        collect: {
            url: [
                "http://localhost:3000",
                "http://localhost:3000/en",
                "http://localhost:3000/pt-BR",
                "http://localhost:3000/en/channel-management",

                "http://localhost:3000/en/pc-optimization",
            ],
            startServerCommand: "npm run build && npm start",
            startServerReadyPattern: "ready",
            startServerReadyTimeout: 30000,
            numberOfRuns: 3,
            settings: {
                chromeFlags: "--no-sandbox --disable-dev-shm-usage",
            },
        },
        assert: {
            assertions: {
                "categories:performance": ["error", { minScore: 0.8 }],
                "categories:accessibility": ["error", { minScore: 0.9 }],
                "categories:best-practices": ["error", { minScore: 0.8 }],
                "categories:seo": ["error", { minScore: 0.8 }],
                // Core Web Vitals
                "largest-contentful-paint": [
                    "error",
                    { maxNumericValue: 2500 },
                ],
                "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
                "first-contentful-paint": ["error", { maxNumericValue: 1800 }],
                "total-blocking-time": ["error", { maxNumericValue: 200 }],
                // Performance metrics
                "speed-index": ["error", { maxNumericValue: 3000 }],
                interactive: ["error", { maxNumericValue: 3000 }],
                // Bundle size
                "unused-javascript": ["warn", { maxNumericValue: 20000 }],
                "unused-css-rules": ["warn", { maxNumericValue: 20000 }],
                // Images
                "modern-image-formats": "error",
                "efficient-animated-content": "error",
                "uses-optimized-images": "error",
                "uses-responsive-images": "error",
                // Network
                "uses-http2": "error",
                "uses-text-compression": "error",
                // Caching
                "uses-long-cache-ttl": "warn",
            },
        },
        upload: {
            target: "temporary-public-storage",
        },
    },
}
