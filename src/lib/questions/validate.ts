import { type MultipleChoiceQuestion, isLanguageCategory } from "./schema"

export interface ValidationIssue {
    questionId: string
    level: "error" | "warning"
    message: string
}

export const validateQuestion = (
    q: MultipleChoiceQuestion
): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
    if (!q.id) {
        issues.push({
            questionId: q.id || "unknown",
            level: "error",
            message: "Missing id",
        })
    }
    if (q.prompt.trim().length === 0) {
        issues.push({
            questionId: q.id,
            level: "error",
            message: "Empty prompt",
        })
    }
    if (q.choices.length !== 4) {
        issues.push({
            questionId: q.id,
            level: "error",
            message: "Choices must have length 4",
        })
    }
    const dup = new Set(q.choices.map(c => c.trim()))
    if (dup.size !== 4) {
        issues.push({
            questionId: q.id,
            level: "warning",
            message: "Choices contain duplicates (trimmed)",
        })
    }
    if (q.answerIndex < 0 || q.answerIndex > 3) {
        issues.push({
            questionId: q.id,
            level: "error",
            message: "Invalid answerIndex",
        })
    }
    if (isLanguageCategory(q.category) && !q.language) {
        issues.push({
            questionId: q.id,
            level: "error",
            message: "Language questions must include language",
        })
    }
    return issues
}

export const validateQuestionSet = (
    qs: MultipleChoiceQuestion[]
): ValidationIssue[] => {
    const seen = new Set<string>()
    const issues: ValidationIssue[] = []
    for (const q of qs) {
        if (seen.has(q.id)) {
            issues.push({
                questionId: q.id,
                level: "error",
                message: "Duplicate id in set",
            })
        }
        seen.add(q.id)
        issues.push(...validateQuestion(q))
    }
    return issues
}
