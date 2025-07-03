import { LucideIcon } from "lucide-react"

export interface EditorsLandingProps {
    locale: "en" | "pt-BR"
}

export interface Skill {
    icon: LucideIcon
    name: string
}

export interface Service {
    icon: LucideIcon
    title: string
    description: string
    features: string[]
}

export interface Tool {
    icon: LucideIcon
    name: string
    description: string
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
