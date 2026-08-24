import { getBlogPostBySlug } from "@/lib/blog"
import { defaultLocale, locales, type Locale } from "@/lib/i18n"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
    params: Promise<{ locale: string; slug: string }>
}

export default async function BlogPostPage({ params }: PageProps) {
    const { locale: rawLocale, slug } = await params
    const locale: Locale = locales.includes(rawLocale as Locale)
        ? (rawLocale as Locale)
        : defaultLocale
    const post = getBlogPostBySlug(slug)

    if (!post) {
        notFound()
    }

    return (
        <article className="container mx-auto max-w-3xl px-4 py-12">
            <Link
                href={`/${locale}/blog`}
                className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
                ← {locale === "pt-BR" ? "Voltar ao Blog" : "Back to Blog"}
            </Link>

            <header className="mb-8">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <time dateTime={post.date}>{post.date}</time>
                    <span>•</span>
                    <span>{post.readTime}</span>
                    <span>•</span>
                    <span>{post.author}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {post.title[locale] || post.title.en}
                </h1>
            </header>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-foreground">
                    {post.content[locale] || post.content.en}
                </p>
            </div>
        </article>
    )
}
