import { TESTIMONIALS } from "@/lib/testimonials"

interface TestimonialsProps {
    locale?: string
}

export function TestimonialsSection({ locale = "pt-BR" }: TestimonialsProps) {
    return (
        <section className="py-12">
            <div className="mx-auto max-w-5xl px-4">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        {locale === "pt-BR" ? "Depoimentos & Avaliações" : "Testimonials & Reviews"}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {locale === "pt-BR" ? "O que dizem os clientes e parceiros" : "What clients and partners say"}
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    {TESTIMONIALS.map(t => (
                        <div
                            key={t.id}
                            className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
                        >
                            <div className="mb-3 flex items-center gap-1 text-amber-500">
                                {Array.from({ length: t.rating }).map((_, i) => (
                                    <span key={i}>★</span>
                                ))}
                            </div>
                            <p className="mb-4 text-sm text-muted-foreground italic">
                                &ldquo;{t.comment[locale] || t.comment["en"]}&rdquo;
                            </p>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                                <p className="text-xs text-muted-foreground">{t.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
