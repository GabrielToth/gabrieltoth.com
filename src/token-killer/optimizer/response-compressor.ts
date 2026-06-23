/**
 * Response Compression Strategy
 *
 * Reduces response token consumption while protecting critical content types.
 *
 * Compression Techniques:
 * - Abbreviations (e.g., "approximately" → "approx.")
 * - Bullet points instead of prose
 * - Structured formatting (tables, lists)
 * - Removal of redundant explanations
 * - Concise phrasing
 *
 * Protected Content Types (never compress):
 * - Code blocks (```...```)
 * - JSON/YAML/structured data
 * - Tables
 * - Step-by-step reasoning (Chain of Thought)
 * - Creative or tone-specific responses
 */

/**
 * Represents a section of response that can be compressed
 */
interface ResponseSection {
    id: string
    type:
        | "code"
        | "json"
        | "yaml"
        | "table"
        | "reasoning"
        | "prose"
        | "list"
        | "creative"
    content: string
    tokenCount: number
    isProtected: boolean
    metadata?: Record<string, any>
}

/**
 * Result of response compression operation
 */
export interface CompressionResult {
    originalTokens: number
    compressedTokens: number
    tokensSaved: number
    savingsPercentage: number
    compressedSections: Array<{
        id: string
        type: string
        originalTokens: number
        compressedTokens: number
        tokensSaved: number
    }>
    protectedSections: Array<{
        id: string
        type: string
        tokenCount: number
    }>
    readabilityScore: number // 0-1 score
    dryRun: boolean
    originalResponseFlag?: string // Flag to retrieve original (e.g., "?original=true")
}

/**
 * Response Compressor - Analyzes and compresses responses
 */
export class ResponseCompressor {
    private minSavingsPercentage = 0.2 // 20% minimum savings
    private abbreviations: Record<string, string> = {
        approximately: "approx.",
        example: "ex.",
        including: "incl.",
        excluding: "excl.",
        information: "info",
        important: "imp.",
        necessary: "nec.",
        possible: "poss.",
        probably: "prob.",
        therefore: "thus",
        however: "tho",
        although: "tho",
        because: "b/c",
        before: "b4",
        without: "w/o",
        with: "w/",
        and: "&",
        or: "|",
        at: "@",
        number: "#",
        percent: "%",
        versus: "vs",
        through: "thru",
        you: "u",
        your: "ur",
        are: "r",
        be: "b",
        see: "c",
        for: "4",
        to: "2",
        too: "2",
        two: "2",
    }

    /**
     * Analyze response into sections
     */
    private analyzeResponse(response: string): ResponseSection[] {
        const sections: ResponseSection[] = []
        let sectionId = 0

        // Split by code blocks first
        const codeBlockRegex = /```[\s\S]*?```/g
        const jsonRegex = /\{[\s\S]*?\}(?=\n|$)/g
        const yamlRegex = /^[\w-]+:[\s\S]*?(?=\n\n|\n[^\s]|$)/gm
        const tableRegex = /\|[\s\S]*?\|[\s\S]*?\|/g
        const reasoningRegex =
            /(?:Step \d+:|Therefore:|Thus:|In conclusion:|As a result:)[\s\S]*?(?=\n\n|Step \d+:|$)/g

        let lastIndex = 0
        const matches: Array<{
            start: number
            end: number
            type: ResponseSection["type"]
            content: string
        }> = []

        // Find all protected content
        for (const match of response.matchAll(codeBlockRegex)) {
            matches.push({
                start: match.index!,
                end: match.index! + match[0].length,
                type: "code",
                content: match[0],
            })
        }

        for (const match of response.matchAll(jsonRegex)) {
            if (
                !this.isOverlapping(
                    matches,
                    match.index!,
                    match.index! + match[0].length
                )
            ) {
                matches.push({
                    start: match.index!,
                    end: match.index! + match[0].length,
                    type: "json",
                    content: match[0],
                })
            }
        }

        for (const match of response.matchAll(yamlRegex)) {
            if (
                !this.isOverlapping(
                    matches,
                    match.index!,
                    match.index! + match[0].length
                )
            ) {
                matches.push({
                    start: match.index!,
                    end: match.index! + match[0].length,
                    type: "yaml",
                    content: match[0],
                })
            }
        }

        for (const match of response.matchAll(tableRegex)) {
            if (
                !this.isOverlapping(
                    matches,
                    match.index!,
                    match.index! + match[0].length
                )
            ) {
                matches.push({
                    start: match.index!,
                    end: match.index! + match[0].length,
                    type: "table",
                    content: match[0],
                })
            }
        }

        for (const match of response.matchAll(reasoningRegex)) {
            if (
                !this.isOverlapping(
                    matches,
                    match.index!,
                    match.index! + match[0].length
                )
            ) {
                matches.push({
                    start: match.index!,
                    end: match.index! + match[0].length,
                    type: "reasoning",
                    content: match[0],
                })
            }
        }

        // Sort matches by position
        matches.sort((a, b) => a.start - b.start)

        // Create sections
        for (const match of matches) {
            if (match.start > lastIndex) {
                // Add prose section before this match
                const proseContent = response.substring(lastIndex, match.start)
                if (proseContent.trim()) {
                    sections.push(
                        this.createSection(sectionId++, "prose", proseContent)
                    )
                }
            }

            sections.push(
                this.createSection(sectionId++, match.type, match.content)
            )
            lastIndex = match.end
        }

        // Add remaining prose
        if (lastIndex < response.length) {
            const remaining = response.substring(lastIndex)
            if (remaining.trim()) {
                sections.push(
                    this.createSection(sectionId++, "prose", remaining)
                )
            }
        }

        // Detect creative content
        this.detectCreativeContent(sections)

        return sections
    }

    /**
     * Check if a range overlaps with existing matches
     */
    private isOverlapping(
        matches: Array<{ start: number; end: number }>,
        start: number,
        end: number
    ): boolean {
        return matches.some(m => start < m.end && end > m.start)
    }

    /**
     * Create a response section
     */
    private createSection(
        id: number,
        type: ResponseSection["type"],
        content: string
    ): ResponseSection {
        const tokenCount = this.estimateTokenCount(content)
        const isProtected = [
            "code",
            "json",
            "yaml",
            "table",
            "reasoning",
            "creative",
        ].includes(type)

        return {
            id: `section_${id}`,
            type,
            content,
            tokenCount,
            isProtected,
        }
    }

    /**
     * Detect creative content that shouldn't be compressed
     */
    private detectCreativeContent(sections: ResponseSection[]): void {
        for (const section of sections) {
            if (section.type === "prose") {
                const content = section.content.toLowerCase()

                // Check for creative indicators
                if (
                    content.includes("imagine") ||
                    content.includes("story") ||
                    content.includes("poem") ||
                    content.includes("creative") ||
                    content.includes("metaphor") ||
                    content.includes("analogy")
                ) {
                    section.type = "creative"
                    section.isProtected = true
                }
            }
        }
    }

    /**
     * Estimate token count (4 characters ≈ 1 token)
     */
    private estimateTokenCount(text: string): number {
        return Math.ceil(text.length / 4)
    }

    /**
     * Compress prose content
     */
    private compressProse(content: string): string {
        let compressed = content

        // Apply abbreviations
        for (const [full, abbrev] of Object.entries(this.abbreviations)) {
            const regex = new RegExp(`\\b${full}\\b`, "gi")
            compressed = compressed.replace(regex, abbrev)
        }

        // Convert long sentences to bullet points
        const sentences = compressed.split(/(?<=[.!?])\s+/)
        if (sentences.length > 3) {
            compressed = sentences
                .map(s => s.trim())
                .filter(s => s.length > 0)
                .map(s => `• ${s}`)
                .join("\n")
        }

        // Remove redundant phrases
        const redundantPhrases = [
            /It is important to note that\s+/gi,
            /It should be noted that\s+/gi,
            /In other words,\s+/gi,
            /As mentioned earlier,\s+/gi,
            /As previously stated,\s+/gi,
            /To summarize,\s+/gi,
            /In conclusion,\s+/gi,
            /Basically,\s+/gi,
            /Essentially,\s+/gi,
            /Ultimately,\s+/gi,
        ]

        for (const phrase of redundantPhrases) {
            compressed = compressed.replace(phrase, "")
        }

        // Remove excessive whitespace
        compressed = compressed.replace(/\n\s*\n+/g, "\n").trim()

        return compressed
    }

    /**
     * Compress sections
     */
    private compressSections(sections: ResponseSection[]): {
        compressed: ResponseSection[]
        savings: number
    } {
        let totalSavings = 0

        const compressed = sections.map(section => {
            if (section.isProtected) {
                return section
            }

            const originalTokens = section.tokenCount
            const compressedContent = this.compressProse(section.content)
            const compressedTokens = this.estimateTokenCount(compressedContent)
            const savings = originalTokens - compressedTokens

            totalSavings += savings

            return {
                ...section,
                content: compressedContent,
                tokenCount: compressedTokens,
            }
        })

        return { compressed, savings: totalSavings }
    }

    /**
     * Calculate readability score (0-1)
     * Higher score = better readability
     */
    private calculateReadabilityScore(sections: ResponseSection[]): number {
        let score = 0.8 // Base score

        // Check if critical content is preserved
        const hasCode = sections.some(s => s.type === "code")
        const hasReasoning = sections.some(s => s.type === "reasoning")
        const hasStructured = sections.some(s =>
            ["json", "yaml", "table"].includes(s.type)
        )

        if (hasCode) score += 0.05
        if (hasReasoning) score += 0.05
        if (hasStructured) score += 0.05

        // Penalize if too much prose was compressed
        const proseCount = sections.filter(s => s.type === "prose").length
        const totalCount = sections.length
        if (proseCount > totalCount * 0.7) {
            score -= 0.1
        }

        return Math.max(0, Math.min(1, score))
    }

    /**
     * Reconstruct response from sections
     */
    private reconstructResponse(sections: ResponseSection[]): string {
        return sections.map(s => s.content).join("\n\n")
    }

    /**
     * Compress response to reduce token consumption
     *
     * @param response - The response to compress
     * @param dryRun - If true, don't modify response, just return estimates
     * @returns Compression result with savings information
     */
    public compress(response: string, dryRun = false): CompressionResult {
        const originalTokens = this.estimateTokenCount(response)

        // Analyze response into sections
        const sections = this.analyzeResponse(response)

        // Compress sections
        const { compressed, savings } = this.compressSections(sections)

        const compressedTokens = compressed.reduce(
            (sum, s) => sum + s.tokenCount,
            0
        )
        const savingsPercentage =
            originalTokens > 0 ? savings / originalTokens : 0

        const readabilityScore = this.calculateReadabilityScore(compressed)

        // Check if compression would significantly reduce clarity
        if (
            readabilityScore < 0.5 ||
            savingsPercentage < this.minSavingsPercentage
        ) {
            // Skip compression if clarity would be significantly reduced
            return {
                originalTokens,
                compressedTokens: originalTokens,
                tokensSaved: 0,
                savingsPercentage: 0,
                compressedSections: [],
                protectedSections: sections
                    .filter(s => s.isProtected)
                    .map(s => ({
                        id: s.id,
                        type: s.type,
                        tokenCount: s.tokenCount,
                    })),
                readabilityScore: 1.0,
                dryRun,
                originalResponseFlag: "?original=true",
            }
        }

        const compressedSections = compressed
            .filter(s => s.type === "prose")
            .map(s => {
                const original = sections.find(sec => sec.id === s.id)
                return {
                    id: s.id,
                    type: s.type,
                    originalTokens: original?.tokenCount ?? 0,
                    compressedTokens: s.tokenCount,
                    tokensSaved: (original?.tokenCount ?? 0) - s.tokenCount,
                }
            })

        const protectedSections = compressed
            .filter(s => s.isProtected)
            .map(s => ({
                id: s.id,
                type: s.type,
                tokenCount: s.tokenCount,
            }))

        return {
            originalTokens,
            compressedTokens,
            tokensSaved: savings,
            savingsPercentage,
            compressedSections,
            protectedSections,
            readabilityScore,
            dryRun,
            originalResponseFlag: "?original=true",
        }
    }

    /**
     * Get compression recommendations without modifying response
     */
    public getRecommendations(response: string): CompressionResult {
        return this.compress(response, true)
    }
}

export default ResponseCompressor
