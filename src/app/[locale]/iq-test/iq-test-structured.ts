import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

export async function buildIQTestStructured(locale: Locale): Promise<{
    breadcrumbs: Array<{ name: string; url: string }>
    webPageStructuredData: Record<string, unknown>
    faqs: Array<{ question: string; answer: string }>
}> {
    const t = await getTranslations({ locale, namespace: "iqTest" })

    const base = "https://www.gabrieltoth.com"
    const localePath = locale === "en" ? "" : `/${locale}`

    const breadcrumbs = [
        { name: "Home", url: `${base}${localePath}/` },
        { name: t("title"), url: `${base}${localePath}/iq-test` },
    ]

    const webPageStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: t("title"),
        description: String(t("description")),
        url: `${base}${localePath}/iq-test`,
        inLanguage:
            locale === "pt-BR"
                ? "pt-BR"
                : locale === "es"
                  ? "es-ES"
                  : locale === "de"
                    ? "de-DE"
                    : "en-US",
        isPartOf: {
            "@type": "WebSite",
            name: "Gabriel Toth Portfolio",
            url: base,
        },
        author: {
            "@type": "Person",
            name: "Gabriel Toth Gonçalves",
            url: base,
        },
        reviewedBy: {
            "@type": "Person",
            name: "Marco Aurélio Virgílio",
            jobTitle: "Psychologist",
            identifier: "CRP 50.893-0",
            affiliation: {
                "@type": "Organization",
                name: "Aletéia - Saúde e Educação",
            },
        },
        mainEntity: {
            "@type": "Quiz",
            name: t("title"),
            about: "IQ assessment using abstract reasoning and pattern recognition (Raven-style progressive matrices).",
            numberOfQuestions: 35,
        },
        dateModified: "2025-03-01",
        potentialAction: {
            "@type": "Action",
            name: t("cta.start"),
            target: `${base}${localePath}/iq-test/step/1`,
        },
    } as Record<string, unknown>

    // Minimal, high-signal FAQs for rich results
    const faqs: Array<{ question: string; answer: string }> = [
        {
            question:
                locale === "pt-BR"
                    ? "Quanto tempo leva o teste?"
                    : locale === "es"
                      ? "¿Cuánto tiempo dura la prueba?"
                      : locale === "de"
                        ? "Wie lange dauert der Test?"
                        : "How long does the test take?",
            answer:
                locale === "pt-BR"
                    ? "Geralmente entre 12 e 20 minutos, dependendo do seu ritmo."
                    : locale === "es"
                      ? "Entre 12 y 20 minutos, según tu ritmo."
                      : locale === "de"
                        ? "In der Regel 12–20 Minuten, je nach Tempo."
                        : "Usually 12–20 minutes, depending on your pace.",
        },
        {
            question:
                locale === "pt-BR"
                    ? "Preciso de conhecimento específico?"
                    : locale === "es"
                      ? "¿Necesito conocimientos específicos?"
                      : locale === "de"
                        ? "Brauche ich spezielles Wissen?"
                        : "Do I need specific knowledge?",
            answer:
                locale === "pt-BR"
                    ? "Não. O teste foca padrão visual e raciocínio lógico; vocabulário avançado não é necessário."
                    : locale === "es"
                      ? "No. La prueba se centra en patrones visuales y razonamiento lógico; no se requiere vocabulario avanzado."
                      : locale === "de"
                        ? "Nein. Der Test fokussiert visuelle Muster und logisches Denken; fortgeschrittener Wortschatz ist nicht nötig."
                        : "No. The test focuses on visual patterns and logical reasoning; advanced vocabulary is not required.",
        },
        {
            question:
                locale === "pt-BR"
                    ? "O resultado é um diagnóstico clínico?"
                    : locale === "es"
                      ? "¿El resultado es un diagnóstico clínico?"
                      : locale === "de"
                        ? "Ist das Ergebnis eine klinische Diagnose?"
                        : "Is the result a clinical diagnosis?",
            answer:
                locale === "pt-BR"
                    ? "Não. É uma estimativa indicativa de habilidades cognitivas e não substitui avaliação psicológica presencial."
                    : locale === "es"
                      ? "No. Es una estimación indicativa de habilidades cognitivas y no reemplaza una evaluación psicológica presencial."
                      : locale === "de"
                        ? "Nein. Es ist eine indikative Schätzung kognitiver Fähigkeiten und ersetzt keine psychologische Untersuchung."
                        : "No. It is an indicative estimate of cognitive abilities and does not replace an in-person psychological assessment.",
        },
    ]

    return { breadcrumbs, webPageStructuredData, faqs }
}
