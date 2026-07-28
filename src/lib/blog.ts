export interface BlogPost {
    slug: string
    title: Record<string, string>
    description: Record<string, string>
    content: Record<string, string>
    date: string
    author: string
    tags: string[]
    readTime: string
}

export const BLOG_POSTS: BlogPost[] = [
    {
        slug: "nextjs-performance-optimization-guide",
        title: {
            en: "Next.js 16 Performance Optimization Guide",
            "pt-BR": "Guia de Otimização de Performance no Next.js 16",
            es: "Guía de Optimización de Rendimiento en Next.js 16",
            de: "Leitfaden zur Leistungsoptimierung in Next.js 16",
            fr: "Guide d'optimisation des performances dans Next.js 16",
        },
        description: {
            en: "Comprehensive guide to achieving 100 Lighthouse score with Next.js 16, ISR, and React Server Components.",
            "pt-BR": "Guia completo para alcançar pontuação 100 no Lighthouse com Next.js 16, ISR e React Server Components.",
            es: "Guía completa para lograr una puntuación de 100 en Lighthouse con Next.js 16, ISR y React Server Components.",
            de: "Umfassender Leitfaden zum Erreichen eines 100 Lighthouse-Scores mit Next.js 16, ISR und React Server Components.",
            fr: "Guide complet pour atteindre un score de 100 sur Lighthouse avec Next.js 16, ISR et React Server Components.",
        },
        content: {
            en: "Performance optimization in modern web applications requires a holistic approach ranging from server-side rendering to image optimization...",
            "pt-BR": "A otimização de desempenho em aplicações web modernas exige uma abordagem holística que vai do rendering no servidor até a otimização de imagens...",
            es: "La optimización del rendimiento en aplicaciones web modernas requiere un enfoque holístico que abarca desde la renderización en el servidor hasta la optimización de imágenes...",
            de: "Die Leistungsoptimierung in modernen Webanwendungen erfordert einen holistischen Ansatz von Serverseiten-Rendering bis hin zur Bildoptimierung...",
            fr: "L'optimisation des performances dans les applications web modernes nécessite une approche globale allant du rendu côté serveur à l'optimisation des images...",
        },
        date: "2026-07-27",
        author: "Gabriel Toth Gonçalves",
        tags: ["Next.js", "Performance", "React", "Web Dev"],
        readTime: "5 min",
    },
]

export function getAllBlogPosts(): BlogPost[] {
    return BLOG_POSTS
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
    return BLOG_POSTS.find(post => post.slug === slug)
}
