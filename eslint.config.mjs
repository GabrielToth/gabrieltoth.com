// ESLint configuration for Next.js 16 with flat config
import storybook from "eslint-plugin-storybook"
import tseslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import jsxA11yPlugin from "eslint-plugin-jsx-a11y"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const eslintConfig = [
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
            "coverage/",
            "playwright-report/",
            "test-results/",
            "storybook-static/",
        ],
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            react: reactPlugin,
            "react-hooks": reactHooksPlugin,
            "jsx-a11y": jsxA11yPlugin,
        },
        rules: {
            // TypeScript rules
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",

            // React rules
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react/no-unescaped-entities": ["error", { forbid: [] }],

            // React Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // Let Prettier handle formatting
            quotes: ["error", "double"],
            semi: ["error", "never"],
            indent: "off",
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
    {
        files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
        rules: {
            quotes: ["error", "double"],
            semi: ["error", "never"],
            indent: "off",
        },
    },
    // Relaxed rules for test files
    {
        files: [
            "**/__tests__/**/*.ts",
            "**/__tests__/**/*.tsx",
            "**/*.test.ts",
            "**/*.test.tsx",
            "**/*.spec.ts",
            "**/*.spec.tsx",
        ],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
    // Relaxed rules for Storybook files
    {
        files: ["**/*.stories.ts", "**/*.stories.tsx"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
    ...storybook.configs["flat/recommended"],
]

export default eslintConfig
