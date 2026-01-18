"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Sparkles, MessageCircle } from "lucide-react"
import type { SoulFileData } from "@/lib/types"

interface StepVibeCheckProps {
  soulData: Partial<SoulFileData>
  updateSoulData: (data: Partial<SoulFileData>) => void
  onNext: () => void
  onPrev: () => void
}

const PROMPTS = [
  "Write a message to a potential co-founder you've never met.",
  "Describe your perfect weekend side project.",
  "How would you explain your work to a smart 10-year-old?",
]

export function StepVibeCheck({ soulData, updateSoulData, onNext, onPrev }: StepVibeCheckProps) {
  const [promptResponses, setPromptResponses] = useState<string[]>(
    soulData.vibeCheck ? soulData.vibeCheck.split("\n\n---\n\n") : ["", "", ""]
  )

  const handleResponseChange = (index: number, value: string) => {
    const newResponses = [...promptResponses]
    newResponses[index] = value
    setPromptResponses(newResponses)
  }

  const handleNext = () => {
    const combinedVibeCheck = promptResponses.join("\n\n---\n\n")
    updateSoulData({
      vibeCheck: combinedVibeCheck,
      raw_assets: {
        ...soulData.raw_assets,
        voice_snippet: combinedVibeCheck,
      },
    })
    onNext()
  }

  const totalCharacters = promptResponses.reduce((sum, response) => sum + response.length, 0)

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary">Voice Signature</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Capture Your Vibe</h1>
        <p className="text-muted-foreground">
          Write naturally. We&apos;ll analyze your tone, word choice, and style so your Doppel sounds like you.
        </p>
      </div>

      <div className="space-y-6">
        {PROMPTS.map((prompt, index) => (
          <Card key={index} className="bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Prompt {index + 1}: {prompt}
              </CardTitle>
              <CardDescription>Write at least 100 characters. The more natural, the better.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Start typing how you'd actually write..."
                value={promptResponses[index] || ""}
                onChange={(e) => handleResponseChange(index, e.target.value)}
                className="min-h-[200px] bg-secondary/50 border-border resize-none"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{promptResponses[index]?.length || 0} characters</span>
                <span>
                  {(promptResponses[index]?.length || 0) >= 100
                    ? "Looking good!"
                    : `${100 - (promptResponses[index]?.length || 0)} more to go`}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="p-4 rounded-lg bg-secondary/30 border border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total characters across all prompts:</span>
            <span className="font-medium">{totalCharacters}</span>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrev} className="gap-2 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={promptResponses.some((response) => (response?.length || 0) < 100)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
