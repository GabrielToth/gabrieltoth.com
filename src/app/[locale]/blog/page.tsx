import { getAllBlogPosts } from "@/lib/blog"
import { defaultLocale, locales, type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface PageProps {
    params: Promise<{ locale: string }>
}

export default async function BlogPage({ params }: PageProps) {
    const { locale: rawLocale } = await params
    const locale: Locale = locales.includes(rawLocale as Locale)
        ? (rawLocale as Locale)
        : defaultLocale
    const t = await getTranslations({ locale, namespace: "blog" })
    const posts = getAllBlogPosts()

    return (
        <main className="container mx-auto max-w-4xl px-4 py-12">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("title")}
            </h1>
            <p className="mb-8 text-muted-foreground">{t("description")}</p>

            <div className="grid gap-6">
                {posts.map(post => (
                    <article
                        key={post.slug}
                        className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
                    >
                        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <time dateTime={post.date}>{post.date}</time>
                            <span>•</span>
                            <span>{post.readTime}</span>
                        </div>
                        <h2 className="mb-2 text-xl font-semibold text-foreground">
                            <Link
                                href={`/${locale}/blog/${post.slug}`}
                                className="hover:underline"
                            >
                                {post.title[locale] || post.title.en}
                            </Link>
                        </h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            {post.description[locale] || post.description.en}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </main>
    )
}
