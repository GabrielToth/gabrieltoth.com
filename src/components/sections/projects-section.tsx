import { type Locale } from '@/lib/i18n'

interface ProjectsSectionProps {
    locale: Locale
}

export default function ProjectsSection({ locale }: ProjectsSectionProps) {
    return (
        <section id='projects' className='py-20'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <h2 className='text-3xl font-bold text-center mb-8'>
                    {locale === 'pt-BR' ? 'Projetos' : 'Projects'}
                </h2>
                <p className='text-center text-muted-foreground'>
                    {locale === 'pt-BR'
                        ? 'Seção de projetos em desenvolvimento...'
                        : 'Projects section coming soon...'}
                </p>
            </div>
        </section>
    )
}
