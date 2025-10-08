import { type Locale } from "@/lib/i18n"

export type QuestionCategory =
    | "math"
    | "physics"
    | "world_history"
    | "biology"
    | "science"
    | "sociology"
    | "philosophy"
    | "logic"
    | "language"

export interface MultipleChoiceQuestion {
    id: string
    category: QuestionCategory
    // Required when category === 'language'
    language?: Locale
    prompt: string // Should be language-agnostic for non-language categories
    choices: [string, string, string, string]
    answerIndex: 0 | 1 | 2 | 3
    // Optional media/source
    imageUrl?: string
    imageAlt?: string
    sourceUrl?: string
    // Metadata
    difficulty?: 1 | 2 | 3 | 4 | 5
    tags?: string[]
}

export const isLanguageCategory = (category: QuestionCategory): boolean => {
    return category === "language"
}

export const allCategories: ReadonlyArray<QuestionCategory> = [
    "math",
    "physics",
    "world_history",
    "biology",
    "science",
    "sociology",
    "philosophy",
    "logic",
    "language",
] as const
