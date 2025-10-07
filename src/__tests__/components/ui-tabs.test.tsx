import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("Tabs", () => {
    it("mounts and renders triggers/content", () => {
        render(
            <Tabs defaultValue="tab1">
                <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">Content 1</TabsContent>
                <TabsContent value="tab2">Content 2</TabsContent>
            </Tabs>
        )
        expect(screen.getByText("Tab 1")).toBeInTheDocument()
    })
})
