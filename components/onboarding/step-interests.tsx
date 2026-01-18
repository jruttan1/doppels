"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Heart, X } from "lucide-react"
import type { SoulFileData } from "@/lib/types"

interface StepInterestsProps {
  soulData: Partial<SoulFileData>
  updateSoulData: (data: Partial<SoulFileData>) => void
  onNext: () => void
  onPrev: () => void
}

const SUGGESTED_INTERESTS = [
  "LLMs",
  "High-Performance Computing",
  "Mechanical Keyboards",
  "Biohacking",
  "Indie Hacking",
  "Espresso Brewing",
  "Open Source",
  "Startups",
  "AI/ML",
  "Distributed Systems",
  "Developer Tools",
  "Product Design",
]

export function StepInterests({ soulData, updateSoulData, onNext, onPrev }: StepInterestsProps) {
  const [interests, setInterests] = useState<string[]>(soulData.raw_assets?.interests || [])
  const [interestInput, setInterestInput] = useState("")

  const addInterest = (interest: string) => {
    if (interest && !interests.includes(interest)) {
      setInterests((prev) => [...prev, interest])
      setInterestInput("")
    }
  }

  const removeInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest))
  }

  const handleNext = () => {
    updateSoulData({
      raw_assets: {
        ...soulData.raw_assets,
        interests,
      },
    })
    onNext()
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary">Interests</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">What Are You Into?</h1>
        <p className="text-muted-foreground">
          Share your interests and hobbies. This helps your Doppel find connections with shared passions.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Your Interests
            </CardTitle>
            <CardDescription>Add interests, hobbies, or topics you're passionate about.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add an interest..."
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addInterest(interestInput)
                  }
                }}
                className="bg-secondary/50"
              />
              <Button variant="outline" onClick={() => addInterest(interestInput)} className="shrink-0 bg-transparent">
                Add
              </Button>
            </div>

            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="gap-1 pr-1">
                    {interest}
                    <button
                      onClick={() => removeInterest(interest)}
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
                {SUGGESTED_INTERESTS.filter((i) => !interests.includes(i)).map((interest) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary"
                    onClick={() => addInterest(interest)}
                  >
                    + {interest}
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
