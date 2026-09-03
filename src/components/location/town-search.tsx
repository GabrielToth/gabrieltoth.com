"use client"

import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useCallback, useEffect, useRef, useState } from "react"

import { searchTowns, type TownResult } from "@/lib/location/nominatim"

const OSM_STYLE = {
    version: 8,
    sources: {
        osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
    },
    layers: [
        {
            id: "osm",
            type: "raster",
            source: "osm",
        },
    ],
} as const

export interface TownSearchLabels {
    placeholder: string
    searching: string
    noResults: string
    error: string
    selected: string
}

interface TownSearchProps {
    labels: TownSearchLabels
    onSelect?: (town: TownResult) => void
}

export function TownSearch({ labels, onSelect }: TownSearchProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const markerRef = useRef<maplibregl.Marker | null>(null)

    const [query, setQuery] = useState("")
    const [results, setResults] = useState<TownResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selected, setSelected] = useState<TownResult | null>(null)

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: OSM_STYLE as unknown as maplibregl.StyleSpecification,
            center: [0, 20],
            zoom: 2,
        })
        map.addControl(new maplibregl.NavigationControl(), "top-right")
        mapRef.current = map

        return () => {
            markerRef.current?.remove()
            map.remove()
            mapRef.current = null
        }
    }, [])

    const runSearch = useCallback(async () => {
        if (query.trim().length < 2) {
            setResults([])
            return
        }
        setLoading(true)
        setError(null)
        try {
            const towns = await searchTowns(query)
            setResults(towns)
        } catch {
            setError("search failed")
            setResults([])
        } finally {
            setLoading(false)
        }
    }, [query])

    const handleSelect = useCallback(
        (town: TownResult) => {
            setSelected(town)
            setResults([])
            setQuery(town.name)
            onSelect?.(town)

            const map = mapRef.current
            if (!map) return
            markerRef.current?.remove()
            markerRef.current = new maplibregl.Marker()
                .setLngLat([town.lon, town.lat])
                .addTo(map)
            map.flyTo({ center: [town.lon, town.lat], zoom: 11 })
        },
        [onSelect]
    )

    return (
        <div className="flex flex-col gap-3">
            <div className="flex gap-2">
                <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && runSearch()}
                    placeholder={labels.placeholder}
                    aria-label={labels.placeholder}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                    type="button"
                    onClick={runSearch}
                    disabled={loading}
                    className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                >
                    {loading ? labels.searching : labels.placeholder}
                </button>
            </div>

            {error ? <p className="text-sm text-red-500">{labels.error}</p> : null}

            {results.length > 0 && (
                <ul className="max-h-48 overflow-auto rounded-md border border-border bg-card text-sm">
                    {results.map(town => (
                        <li key={town.id}>
                            <button
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-muted"
                                onClick={() => handleSelect(town)}
                            >
                                {town.displayName}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && !error ? (
                <p className="text-sm text-muted-foreground">{labels.noResults}</p>
            ) : null}

            {selected ? (
                <p className="text-sm text-muted-foreground" data-testid="selected-town">
                    {labels.selected}: {selected.displayName}
                </p>
            ) : null}

            <div
                ref={mapContainerRef}
                data-testid="town-map"
                className="h-80 w-full rounded-md border border-border"
            />
        </div>
    )
}
