import { type Locale } from "@/lib/i18n"
import { type MultipleChoiceQuestion } from "./schema"

export type QuestionPackName =
    | "math"
    | "physics"
    | "world_history"
    | "biology"
    | "science"
    | "sociology"
    | "philosophy"
    | "logic"
    | "language"

export const loadQuestions = async (
    locale: Locale,
    pack: QuestionPackName
): Promise<MultipleChoiceQuestion[]> => {
    switch (pack) {
        case "math": {
            const data = await import(`@/i18n/${locale}/questions/math.json`)
            return data.default as MultipleChoiceQuestion[]
        }
        case "physics": {
            const data = await import(`@/i18n/${locale}/questions/physics.json`)
            return data.default as MultipleChoiceQuestion[]
        }
        case "world_history": {
            try {
                const data = await import(
                    `@/i18n/${locale}/questions/world-history.json`
                )
                return data.default as MultipleChoiceQuestion[]
            } catch {
                return []
            }
        }
        case "biology": {
            const data = await import(`@/i18n/${locale}/questions/biology.json`)
            return data.default as MultipleChoiceQuestion[]
        }
        case "science": {
            const data = await import(`@/i18n/${locale}/questions/science.json`)
            return data.default as MultipleChoiceQuestion[]
        }
        case "sociology": {
            const data = await import(
                `@/i18n/${locale}/questions/sociology.json`
            )
            return data.default as MultipleChoiceQuestion[]
        }
        case "philosophy": {
            const data = await import(
                `@/i18n/${locale}/questions/philosophy.json`
            )
            return data.default as MultipleChoiceQuestion[]
        }
        case "logic": {
            const data = await import(`@/i18n/${locale}/questions/logic.json`)
            return data.default as MultipleChoiceQuestion[]
        }
        case "language": {
            const data = await import(
                `@/i18n/${locale}/questions/language.json`
            )
            return data.default as MultipleChoiceQuestion[]
        }
        default:
            return []
    }
}
