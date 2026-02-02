"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Filter, MapPin, X } from "lucide-react"
import type { SoulFileData } from "@/lib/types"

interface StepFiltersProps {
  soulData: Partial<SoulFileData>
  updateSoulData: (data: Partial<SoulFileData>) => void
  onNext: () => void
  onPrev: () => void
}

const SUGGESTED_LOCATIONS = ["North America", "Europe", "Remote", "San Francisco", "New York", "London", "Singapore"]

export function StepFilters({ soulData, updateSoulData, onNext, onPrev }: StepFiltersProps) {
  const [locations, setLocations] = useState<string[]>(soulData.filters?.locations || [])
  const [locationInput, setLocationInput] = useState("")

  const addLocation = (location: string) => {
    if (location && !locations.includes(location)) {
      setLocations((prev) => [...prev, location])
      setLocationInput("")
    }
  }

  const removeLocation = (location: string) => {
    setLocations((prev) => prev.filter((l) => l !== location))
  }

  const handleNext = () => {
    updateSoulData({
      filters: {
        locations,
      },
    })
    onNext()
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary">Gatekeeper</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Set Your Filters</h1>
        <p className="text-muted-foreground">
          Define hard requirements. Your Doppels won&apos;t waste time on connections that don&apos;t meet these
          criteria.
        </p>
      </div>

      <div className="space-y-6">
        {/* Location Filter */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location Preferences
            </CardTitle>
            <CardDescription>Where should your connections be based?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a location..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLocation(locationInput)}
                className="bg-input border-border"
              />
              <Button variant="outline" onClick={() => addLocation(locationInput)} className="shrink-0 bg-transparent">
                Add
              </Button>
            </div>

            {locations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {locations.map((location) => (
                  <Badge key={location} variant="secondary" className="gap-1 pr-1">
                    {location}
                    <button
                      onClick={() => removeLocation(location)}
                      className="ml-1 p-0.5 hover:bg-background/50 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_LOCATIONS.filter((l) => !locations.includes(l)).map((location) => (
                  <Badge
                    key={location}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => addLocation(location)}
                  >
                    + {location}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrev} className="gap-2 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button onClick={handleNext} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
