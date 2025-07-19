"use client"

import { defaultSeoConfig } from "@/lib/seo"
import { DefaultSeo } from "next-seo"

interface SeoProviderProps {
    children: React.ReactNode
}

const SeoProvider = ({ children }: SeoProviderProps) => {
    return (
        <>
            <DefaultSeo {...defaultSeoConfig} />
            {children}
        </>
    )
}

export default SeoProvider
