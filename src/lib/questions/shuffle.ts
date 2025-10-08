import { type MultipleChoiceQuestion, type QuestionCategory } from "./schema"

// Mulberry32 pseudo-random generator for deterministic shuffles
function mulberry32(seed: number) {
    let t = seed >>> 0
    return function () {
        t += 0x6d2b79f5
        let r = Math.imul(t ^ (t >>> 15), 1 | t)
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
}

export function shuffleArray<T>(items: T[], seed = 1): T[] {
    const rand = mulberry32(seed)
    const arr = items.slice()
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

export function interleaveShuffled(
    buckets: Array<MultipleChoiceQuestion[]>,
    seed = 1
): MultipleChoiceQuestion[] {
    // Shuffle buckets order and each bucket internally
    const outer = shuffleArray(
        buckets.map(b => shuffleArray(b, seed + b.length)),
        seed
    )
    const result: MultipleChoiceQuestion[] = []
    const indices = new Array(outer.length).fill(0)
    let remaining = outer.reduce((acc, b) => acc + b.length, 0)
    let idx = 0
    while (remaining > 0) {
        const bucketIdx = idx % outer.length
        const bucket = outer[bucketIdx]
        const ptr = indices[bucketIdx]
        if (ptr < bucket.length) {
            result.push(bucket[ptr])
            indices[bucketIdx] = ptr + 1
            remaining -= 1
        }
        idx += 1
    }
    return result
}

export function getShuffledByCategory(
    byCategory: Record<QuestionCategory, MultipleChoiceQuestion[]>,
    seed = 1
): MultipleChoiceQuestion[] {
    const buckets = Object.values(byCategory)
    return interleaveShuffled(buckets, seed)
}
