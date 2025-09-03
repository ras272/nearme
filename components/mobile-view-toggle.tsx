"use client"

import type React from "react"

import { useState } from "react"
import { Map, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface MobileViewToggleProps {
  mapView: React.ReactNode
  listView: React.ReactNode
  clinicsCount: number
}

export default function MobileViewToggle({ mapView, listView, clinicsCount }: MobileViewToggleProps) {
  const [activeView, setActiveView] = useState<"map" | "list">("list")

  return (
    <div className="lg:hidden">
      {/* Mobile Toggle Buttons */}
      <Card className="mb-4 border-emerald-200">
        <CardContent className="p-2">
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant={activeView === "list" ? "default" : "ghost"}
              onClick={() => setActiveView("list")}
              className={`w-full ${
                activeView === "list"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
              size="sm"
            >
              <List className="w-4 h-4 mr-2" />
              Lista ({clinicsCount})
            </Button>
            <Button
              variant={activeView === "map" ? "default" : "ghost"}
              onClick={() => setActiveView("map")}
              className={`w-full ${
                activeView === "map"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
              size="sm"
            >
              <Map className="w-4 h-4 mr-2" />
              Mapa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile View Content */}
      <div className="min-h-[600px]">{activeView === "list" ? listView : mapView}</div>
    </div>
  )
}
