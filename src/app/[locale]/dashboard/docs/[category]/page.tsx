import { DocsPage } from "@/components/tutorial/docs-page"

interface PageProps {
    params: Promise<{ category: string }>
}

export default async function CategoryDocsPage({ params }: PageProps) {
    const { category } = await params
    return <DocsPage category={category} />
}
