/* eslint-disable no-console */
const fs = require("fs")
const path = require("path")

const locales = ["en", "pt-BR", "es", "de"]

function ensureDir(p) {
    fs.mkdirSync(p, { recursive: true })
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + "\n", "utf8")
}

function seqQuestion(prefix, i) {
    // simple arithmetic progression series: a, a+d, a+2d, a+3d, ? -> a+4d
    const a = 2 + (i % 7)
    const d = 1 + (i % 5)
    const s1 = a
    const s2 = a + d
    const s3 = a + 2 * d
    const s4 = a + 3 * d
    const correct = a + 4 * d
    return {
        id: `${prefix}-${String(i).padStart(3, "0")}`,
        prompt: `${s1}, ${s2}, ${s3}, ${s4}, ?`,
        choices: [
            String(correct),
            String(correct - d),
            String(correct + d),
            String(correct - 2 * d),
        ],
        answerIndex: 0,
    }
}

function buildPack(prefix, count) {
    const arr = []
    for (let i = 1; i <= count; i++) {
        const q = seqQuestion(prefix, i)
        arr.push({
            id: q.id,
            prompt: q.prompt,
            choices: q.choices,
            answerIndex: 0,
        })
    }
    return arr
}

function makeCategoryPack(category, prefix, count) {
    const base = buildPack(prefix, count)
    return base.map(q => ({
        id: q.id,
        category,
        prompt: q.prompt,
        choices: q.choices,
        answerIndex: q.answerIndex,
    }))
}

function generateAll() {
    for (const locale of locales) {
        const dir = path.join("src", "i18n", locale, "questions")
        ensureDir(dir)

        // Biology, Science, Sociology, Philosophy (100 each)
        const biology = makeCategoryPack("biology", "bio", 100)
        const science = makeCategoryPack("science", "sci", 100)
        const sociology = makeCategoryPack("sociology", "soc", 100)
        const philosophy = makeCategoryPack("philosophy", "phil", 100)

        writeJson(path.join(dir, "biology.json"), biology)
        writeJson(path.join(dir, "science.json"), science)
        writeJson(path.join(dir, "sociology.json"), sociology)
        writeJson(path.join(dir, "philosophy.json"), philosophy)

        // Logic (1000)
        const logic = makeCategoryPack("logic", "logic", 1000)
        writeJson(path.join(dir, "logic.json"), logic)

        // Language (100 each, tag with locale)
        const language = makeCategoryPack("language", "lang", 100).map(q => ({
            ...q,
            language: locale,
        }))
        writeJson(path.join(dir, "language.json"), language)
    }
}

generateAll()
console.log("Generated question packs for:", locales.join(", "))
