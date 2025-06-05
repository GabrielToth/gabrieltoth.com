import { type Locale } from '@/lib/i18n'

interface ContactSectionProps {
    locale: Locale
}

export default function ContactSection({ locale }: ContactSectionProps) {
    return (
        <section id='contact' className='py-20 bg-muted/20'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <h2 className='text-3xl font-bold text-center mb-8'>
                    {locale === 'pt-BR' ? 'Contato' : 'Contact'}
                </h2>
                <p className='text-center text-muted-foreground'>
                    {locale === 'pt-BR'
                        ? 'Seção de contato em desenvolvimento...'
                        : 'Contact section coming soon...'}
                </p>
            </div>
        </section>
    )
}
