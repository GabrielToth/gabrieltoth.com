export interface TermsSection {
    title: string
    text: string
}

export interface TermsSectionsMap {
    acceptance: TermsSection
    services: TermsSection
    responsibilities: TermsSection
    limitations: TermsSection
    privacy: TermsSection
    modifications: TermsSection
    termination: TermsSection
    governing: TermsSection
    contact: TermsSection
}

export interface TermsContent {
    title: string
    lastUpdated: string
    acceptance: TermsSection
    services: TermsSection
    responsibilities: TermsSection
    limitations: TermsSection
    privacy: TermsSection
    modifications: TermsSection
    termination: TermsSection
    governing: TermsSection
    contact: TermsSection
}
