// @vitest-environment node
import { describe, expect, it, vi } from "vitest"

import { searchTowns } from "@/lib/location/nominatim"

const OSM_FIXTURE = [
    {
        place_id: 123,
        licence: "Data © OpenStreetMap contributors",
        osm_type: "relation",
        osm_id: 456,
        lat: "-25.4296",
        lon: "-49.2712",
        display_name: "Curitiba, Paraná, Brazil",
        type: "city",
        importance: 0.75,
        address: {
            city: "Curitiba",
            state: "Paraná",
            country: "Brazil",
            country_code: "br",
        },
    },
]

describe("searchTowns", () => {
    it("returns empty for queries shorter than 2 chars without calling fetch", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch")
        expect(await searchTowns("")).toEqual([])
        expect(await searchTowns(" a")).toEqual([])
        expect(fetchSpy).not.toHaveBeenCalled()
        fetchSpy.mockRestore()
    })

    it("maps Nominatim results to TownResult with address fallback", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify(OSM_FIXTURE), { status: 200 })
            )
        )

        const results = await searchTowns("curitiba")
        expect(results).toHaveLength(1)
        expect(results[0]).toMatchObject({
            id: 123,
            name: "Curitiba",
            displayName: "Curitiba, Paraná, Brazil",
            lat: -25.4296,
            lon: -49.2712,
            type: "city",
        })

        const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
        expect(calledUrl).toContain("nominatim.openstreetmap.org/search")
        expect(calledUrl).toContain("q=curitiba")
        expect(calledUrl).toContain("format=jsonv2")
        vi.unstubAllGlobals()
    })

    it("applies countrycodes and limit params", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(new Response("[]", { status: 200 }))
        )
        await searchTowns("paris", { limit: 3, countryCodes: ["fr", "be"] })
        const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
        expect(calledUrl).toContain("limit=3")
        expect(calledUrl).toContain("countrycodes=fr%2Cbe")
        vi.unstubAllGlobals()
    })

    it("throws on non-ok responses", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(new Response("oops", { status: 500 }))
        )
        await expect(searchTowns("curitiba")).rejects.toThrow("500")
        vi.unstubAllGlobals()
    })

    it("falls back to display_name first segment when no address fields", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify([
                        { ...OSM_FIXTURE[0], address: undefined },
                    ]),
                    { status: 200 }
                )
            )
        )
        const results = await searchTowns("curitiba")
        expect(results[0].name).toBe("Curitiba")
        vi.unstubAllGlobals()
    })
})
