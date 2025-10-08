import { type MultipleChoiceQuestion } from "./schema"

export const editorialChecklist: ReadonlyArray<string> = [
    "Prompt claro, objetivo e sem ambiguidade",
    "Alternativas plausíveis e uma única correta",
    "Sem pistas óbvias (comprimento, padrões de letras, etc.)",
    "Conteúdo coerente com a categoria e nível de dificuldade",
    "Sem dependência de idioma para categorias não linguísticas",
    "Fonte indicada quando houver imagem/hotlink",
    "Evitar conteúdo sensível ou enviesado",
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
        notes.push("Prompt muito curto")
    }
    if (q.choices.some(c => c.trim().length === 0)) {
        notes.push("Alguma alternativa está vazia")
    }
    if (new Set(q.choices.map(c => c.trim())).size !== 4) {
        notes.push("Alternativas duplicadas (após trim)")
    }
    const passed = notes.length === 0
    return { questionId: q.id, passed, notes }
}
