// SEO barrel re-export
// Split from monolithic seo.ts into smaller files

export * from "./seo-types"
export { defaultSeoConfig, generateSeoConfig } from "./seo-config"
export {
    generatePersonStructuredData,
    generateWebsiteStructuredData,
    generateOrganizationStructuredData,
    generateBreadcrumbStructuredData,
    generateFAQStructuredData,
} from "./seo-structured-data"
export { getAllPages, generateRobotsContent } from "./seo-sitemap"
