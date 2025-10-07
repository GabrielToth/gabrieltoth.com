import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/seo", () => ({
    generateSeoConfig: () => ({
        title: "t",
        description: "d",
        additionalMetaTags: [
            { name: "keywords", content: "k" },
            { name: "robots", content: "index,follow" },
        ],
        openGraph: {
            title: "ogt",
            description: "ogd",
            type: "website",
            locale: "en",
            images: [{ url: "https://x/img.jpg", width: 1200, height: 630, alt: "alt", type: "image/jpeg" }],
        },
        twitter: {
            card: "summary_large_image",
            title: "tt",
            description: "td",
            images: ["https://x/img.jpg"],
            creator: "@me",
            site: "@me",
        },
        canonical: "https://x/en/editors/",
    }),
}));

describe("editors metadata coverage", () => {
    it("generates metadata from seo config", async () => {
        const { generateMetadata } = await import(
            "@/app/[locale]/editors/editors-metadata"
        );
        const md = await generateMetadata({
            params: Promise.resolve({ locale: "en" as any }),
        } as any);
        expect(md.title).toBe("t");
        expect(md.openGraph?.images?.[0]?.url).toContain("https://x/");
        expect(md.twitter?.card).toBe("summary_large_image");
        expect(md.alternates?.languages?.en).toContain("/en/editors/");
    });
});


