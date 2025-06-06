import { FlatCompat } from "@eslint/eslintrc"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
    baseDirectory: __dirname,
})

const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        ignores: [
            "node_modules/",
            ".next/",
            "out/",
            "dist/",
            "build/",
            "*.tsbuildinfo",
            "next-env.d.ts",
            "package-lock.json",
            "yarn.lock",
            "pnpm-lock.yaml",
            ".env*",
            ".vscode/",
            ".idea/",
            ".git/",
        ],
        rules: {
            // Basic formatting (Prettier will handle most)
            indent: ["error", 4],
            quotes: ["error", "double"],
            semi: ["error", "never"],
            // Allow double quotes in JSX content
            "react/no-unescaped-entities": ["error", { forbid: [] }],
        },
    },
]

export default eslintConfig
