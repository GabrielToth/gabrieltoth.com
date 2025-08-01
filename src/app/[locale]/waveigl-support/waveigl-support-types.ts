import { type Locale } from "@/lib/i18n"

export interface WaveIGLSupportProps {
    locale: Locale
}

export interface WaveIGLSupportViewProps extends WaveIGLSupportProps {
    translations: WaveIGLSupportTranslations
    selectedMethod: "pix" | "monero"
    setSelectedMethod: (method: "pix" | "monero") => void
    customAmount: string
    setCustomAmount: (amount: string) => void
    paymentType: "one-time" | "subscription"
    setPaymentType: (type: "one-time" | "subscription") => void
    onPaymentMethodClick: (method: "monero" | "pix") => void
    onScrollToDonation: () => void
    donationSectionRef: React.RefObject<HTMLDivElement | null>
}

export interface HeroStat {
    number: string
    label: string
}

export interface MissionPoint {
    title: string
    description: string
}

export interface ProjectItem {
    title: string
    description: string
    progress: number
    budget: string
    status: string
}

export interface TransparencyBreakdown {
    category: string
    percentage: number
    amount: string
    description: string
}

export interface RewardTier {
    tier: string
    benefits: string[]
}

export interface TestimonialItem {
    name: string
    role: string
    content: string
    amount: string
}

export interface SuggestedAmount {
    amount?: string
    label: string
    description: string
}

export interface PaymentMethod {
    title: string
    description: string
    features: string[]
}

export interface WaveIGLSupportTranslations {
    hero: {
        badge: string
        title: string
        subtitle: string
        cta: string
        stats: HeroStat[]
    }
    mission: {
        title: string
        subtitle: string
        points: MissionPoint[]
    }
    projects: {
        title: string
        subtitle: string
        list: ProjectItem[]
    }
    transparency: {
        title: string
        subtitle: string
        breakdown: TransparencyBreakdown[]
    }
    rewards: {
        title: string
        subtitle: string
        perks: RewardTier[]
    }
    testimonials: {
        title: string
        subtitle: string
        items: TestimonialItem[]
    }
    donation: {
        title: string
        subtitle: string
        moneroBonus: string
        suggestedAmounts: {
            donator: SuggestedAmount
            theDonator: SuggestedAmount
        }
        oneTime: string
        monthly: string
        monthlyAnnualPlan?: string
        pixDonation?: string
        scanQrCode?: string
        copyPixKey?: string
        pixKeyCopied?: string
        chooseAmount?: string
        annual?: string
    }
    payment: {
        methods: {
            pix: PaymentMethod
            monero: PaymentMethod
        }
        dialog: {
            oneTime: string
            monthly: string
            description: string
            customAmount: string
            instantPayment: string
            anonymousPayment: string
        }
        alerts: {
            enterAmount: string
            pixMonthlyNotSupported: string
        }
    }
    common: {
        progress: string
        goal: string
        totalInvestmentNeeded: string
        overallProgress: string
        inDevelopment: string
    }
    faq: {
        question1: string
        answer1: string
        question2: string
        answer2: string
        question3: string
        answer3: string
        question4: string
        answer4: string
    }
    organizationDescription: string
}
