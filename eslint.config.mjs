// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook"

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
            // Let Prettier handle formatting
            quotes: ["error", "double"],
            semi: ["error", "never"],
            // Allow double quotes in JSX content
            "react/no-unescaped-entities": ["error", { forbid: [] }],
            // Disable indent rule to avoid conflicts with Prettier
            indent: "off",
        },
    },
    ...storybook.configs["flat/recommended"],
]

export default eslintConfig
