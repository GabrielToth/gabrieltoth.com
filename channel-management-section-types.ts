import { LucideIcon } from "lucide-react"

export interface Stat {
    number: string
    label: string
}

export interface Skill {
    icon: LucideIcon
    name: string
}

export interface Problem {
    icon: LucideIcon
    title: string
    description: string
}

export interface Service {
    icon: LucideIcon
    title: string
    description: string
    features: string[]
}

export interface Metric {
    value: string
    label: string
}

export interface Result {
    channel: string
    description: string
    metrics: Metric[]
}

export interface Testimonial {
    rating: number
    content: string
    name: string
    role: string
}

export interface Plan {
    name: string
    basePrice: number
    description: string
    features: string[]
    popular?: boolean
    editingNote?: string
}

export interface ChannelManagementTranslations {
    hero: {
        badge: string
        title: string
        subtitle: string
        cta: string
        stats: Stat[]
    }
    about: {
        title: string
        description: string
        intro: string
        experience: string
        passion: string
        skills: Skill[]
    }
    problems: {
        title: string
        subtitle: string
        items: Problem[]
    }
    services: {
        title: string
        subtitle: string
        items: Service[]
    }
    results: {
        title: string
        subtitle: string
        items: Result[]
    }
    testimonials: {
        title: string
        subtitle: string
        items: Testimonial[]
    }
    pricing: {
        title: string
        subtitle: string
        plans: Plan[]
        note: string
    }
}
