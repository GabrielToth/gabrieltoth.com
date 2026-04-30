import { type MultipleChoiceQuestion } from "./schema"

export const editorialChecklist: ReadonlyArray<string> = [
    "Clear, objective, and unambiguous prompt",
    "Plausible alternatives with a single correct answer",
    "No obvious hints (length, letter patterns, etc.)",
    "Content coherent with category and difficulty level",
    "No language dependency for non-linguistic categories",
    "Source indicated when there is an image/hotlink",
    "Avoid sensitive or biased content",
]

export interface EditorialResult {
    questionId: string
    passed: boolean
    notes: string[]
}

export const runEditorialChecklist = (
    q: MultipleChoiceQuestion
): EditorialResult => {
    const notes: string[] = []
    if (q.prompt.length < 8) {
        notes.push("Prompt too short")
    }
    if (q.choices.some(c => c.trim().length === 0)) {
        notes.push("Some alternative is empty")
    }
    if (new Set(q.choices.map(c => c.trim())).size !== 4) {
        notes.push("Duplicate alternatives (after trim)")
    }
    const passed = notes.length === 0
    return { questionId: q.id, passed, notes }
}
