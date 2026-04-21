/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#0070F3",
                dark: "#000000",
                white: "#FFFFFF",
                gray: {
                    50: "#F5F5F5",
                    100: "#EBEBEB",
                    600: "#666666",
                    900: "#1A1A1A",
                },
                success: "#0FD66F",
                error: "#FF4757",
                warning: "#FFA502",
            },
            fontFamily: {
                sans: [
                    "var(--font-geist-sans)",
                    "Geist",
                    "system-ui",
                    "sans-serif",
                ],
                mono: ["var(--font-geist-mono)", "Geist Mono", "monospace"],
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-in-out",
                "slide-up": "slideUp 0.3s ease-out",
                "slide-down": "slideDown 0.3s ease-out",
                "bounce-slow": "bounce 2s infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideDown: {
                    "0%": { transform: "translateY(-10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
            },
            spacing: {
                18: "4.5rem",
                88: "22rem",
                128: "32rem",
                sidebar: "240px",
            },
            screens: {
                xs: "475px",
                "3xl": "1600px",
            },
        },
    },
    plugins: [],
    darkMode: "class",
}
