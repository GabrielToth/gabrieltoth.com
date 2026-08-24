export interface Testimonial {
    id: string
    name: string
    role: string
    company?: string
    avatarUrl?: string
    comment: Record<string, string>
    rating: number
}

export const TESTIMONIALS: Testimonial[] = [
    {
        id: "t1",
        name: "Alex Silva",
        role: "Content Creator & Youtuber",
        comment: {
            "pt-BR":
                "O Gabriel otimizou a infraestrutura dos meus canais e a automação de publicação. O tempo de postagem caiu 80%!",
            en: "Gabriel optimized my channel infrastructure and publication automation. Post time dropped by 80%!",
            es: "¡Gabriel optimizó la infraestructura de mis canales y la automatización de publicaciones. El tiempo de publicación se redujo un 80%!",
            de: "Gabriel hat meine Kanalinfrastruktur und Veröffentlichungsautomatisierung optimiert. Die Veröffentlichungszeit sank um 80%!",
            fr: "Gabriel a optimisé l'infrastructure de mes chaînes et l'automatisation des publications. Le temps de publication a diminué de 80% !",
        },
        rating: 5,
    },
    {
        id: "t2",
        name: "Lucas Mendes",
        role: "Competitive Gamer",
        comment: {
            "pt-BR":
                "A otimização de PC foi surreal. Ganhei mais de 60 FPS no Valorant e o frametime ficou super liso.",
            en: "The PC optimization was unreal. Gained over 60 FPS in Valorant and the frametime became super smooth.",
            es: "La optimización de PC fue irreal. ¡Gané más de 60 FPS en Valorant y el frametime quedó súper fluido!",
            de: "Die PC-Optimierung war unglaublich. Über 60 FPS mehr in Valorant und das Frametime wurde extrem flüssig.",
            fr: "L'optimisation du PC était incroyable. J'ai gagné plus de 60 FPS dans Valorant et le frametime est devenu très fluide.",
        },
        rating: 5,
    },
]
