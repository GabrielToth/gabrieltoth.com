// NOTE: Tailwind CSS v3 config is unused — this project uses Tailwind v4.
// All design tokens are defined in src/app/globals.css via @theme {}.
// This file is kept only for tooling compatibility (components.json reference).
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: { extend: {} },
    plugins: [],
}
