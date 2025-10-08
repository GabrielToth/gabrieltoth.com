"use client"

import type { MultipleChoiceQuestion } from "@/lib/questions/schema"
import Link from "next/link"
import { useMemo, useState } from "react"

interface QuestionsDebugPanelProps {
    open: boolean
    closeHref: string
    dataByCategory: Array<{
        name: string
        questions: MultipleChoiceQuestion[]
    }>
}

const QuestionsDebugPanel = ({
    open,
    closeHref,
    dataByCategory,
}: QuestionsDebugPanelProps) => {
    const [activeIdx, setActiveIdx] = useState(0)
    const active = useMemo(
        () => dataByCategory[activeIdx],
        [dataByCategory, activeIdx]
    )

    if (!open) return null

    return (
        <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-lg font-semibold">
                    Debug — Questions Browser
                </h2>
                <Link
                    href={closeHref}
                    className="rounded-md border px-2 py-1 hover:bg-muted"
                >
                    Close
                </Link>
            </div>
            <div className="grid grid-cols-12 h-full">
                <nav className="col-span-4 border-r overflow-auto">
                    <ul className="divide-y">
                        {dataByCategory.map((c, idx) => (
                            <li key={c.name}>
                                <button
                                    type="button"
                                    onClick={() => setActiveIdx(idx)}
                                    className={`w-full text-left px-3 py-2 hover:bg-muted ${idx === activeIdx ? "bg-muted" : ""}`}
                                >
                                    {c.name} ({c.questions.length})
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="col-span-8 overflow-auto p-3">
                    <h3 className="mb-2 font-medium">{active?.name}</h3>
                    <ul className="space-y-2">
                        {active?.questions.map(q => (
                            <li key={q.id} className="rounded-md border p-2">
                                <div className="text-sm font-semibold mb-1">
                                    {q.id}
                                </div>
                                <div className="mb-1 text-sm">{q.prompt}</div>
                                <div className="text-xs">
                                    Options: {q.choices.join(" | ")}
                                </div>
                                <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                                    Correct: {q.choices[q.answerIndex]}
                                </div>
                                {q.imageUrl && (
                                    <div className="mt-2">
                                        {/* Hotlinked image for debug only */}
                                        <img
                                            src={q.imageUrl}
                                            alt={q.imageAlt || "question image"}
                                            className="max-h-40 rounded border"
                                        />
                                    </div>
                                )}
                                {q.sourceUrl && (
                                    <div className="mt-1 text-xs">
                                        Fonte:{" "}
                                        <a
                                            href={q.sourceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline"
                                        >
                                            {q.sourceUrl}
                                        </a>
                                    </div>
                                )}
                            </li>
                        ))}
                        {(!active || active.questions.length === 0) && (
                            <li className="text-sm text-muted-foreground">
                                No questions available.
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </aside>
    )
}

export default QuestionsDebugPanel
