// @vitest-environment node
import * as sitemapDe from "@/app/sitemap-de.xml/route"
import * as sitemapEn from "@/app/sitemap-en.xml/route"
import * as sitemapEs from "@/app/sitemap-es.xml/route"
import * as sitemapPt from "@/app/sitemap-pt-BR.xml/route"
import { describe, expect, it } from "vitest"

describe("locale sitemaps routes", () => {
    it("en GET/HEAD", async () => {
        const get = await sitemapEn.GET()
        expect((get as Response).status).toBe(200)
        const head = await sitemapEn.HEAD()
        expect((head as Response).status).toBe(200)
    })

    it("pt-BR GET/HEAD", async () => {
        const get = await sitemapPt.GET()
        expect((get as Response).status).toBe(200)
        const head = await sitemapPt.HEAD()
        expect((head as Response).status).toBe(200)
    })

    it("es GET/HEAD", async () => {
        const get = await sitemapEs.GET()
        expect((get as Response).status).toBe(200)
        const head = await sitemapEs.HEAD()
        expect((head as Response).status).toBe(200)
    })

    it("de GET/HEAD", async () => {
        const get = await sitemapDe.GET()
        expect((get as Response).status).toBe(200)
        const head = await sitemapDe.HEAD()
        expect((head as Response).status).toBe(200)
    })
})
