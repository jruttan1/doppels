"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { SoulFileData } from "@/lib/types"
import { cn } from "@/lib/utils"

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
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

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
  // Only require the first prompt to be filled (>= 100 characters)
  const isValid = (promptResponses[0]?.length || 0) >= 100

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-light mb-3 text-white">
          Voice Signature
        </h1>
        <p className="text-white/50">
          Write naturally so your Doppel sounds like you.
        </p>
        <p className="text-white/40 text-sm mt-2">
          Complete at least the first question. Additional questions are optional.
        </p>
      </div>

      <div className="space-y-6">
        {PROMPTS.map((prompt, index) => (
          <div 
            key={index} 
            className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <p className="text-sm text-white/70">
                {prompt}
              </p>
              {index > 0 && (
                <span className="text-xs text-white/40 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  Optional
                </span>
              )}
            </div>
            
            <div className="relative">
              <textarea
                placeholder="Start typing how you'd actually write..."
                value={promptResponses[index] || ""}
                onChange={(e) => handleResponseChange(index, e.target.value)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                className={cn(
                  "w-full min-h-[160px] bg-transparent border-0 border-b-2 text-base placeholder:text-white/20 focus:outline-none transition-colors resize-none px-0 py-2",
                  focusedIndex === index ? "border-white/50" : "border-white/10"
                )}
              />
            </div>
            
            <div className="flex justify-between mt-3 text-xs">
              <span className="text-white/30">{promptResponses[index]?.length || 0} characters</span>
              {index === 0 ? (
                <span className={cn(
                  (promptResponses[index]?.length || 0) >= 100 ? "text-white/60" : "text-white/30"
                )}>
                  {(promptResponses[index]?.length || 0) >= 100
                    ? "✓ Good"
                    : `${100 - (promptResponses[index]?.length || 0)} more`}
                </span>
              ) : (
                <span className="text-white/40">
                  {(promptResponses[index]?.length || 0) >= 100 ? "✓ Good" : "Optional"}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Progress indicator */}
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/40">Total characters</span>
            <span className={cn(
              "font-mono",
              totalCharacters >= 300 ? "text-white/70" : "text-white/40"
            )}>{totalCharacters}</span>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button 
            variant="ghost" 
            onClick={onPrev} 
            className="gap-2 text-white/50 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isValid}
            className="gap-2 bg-white text-black hover:bg-white/90 border-0 h-12 px-6 disabled:opacity-30"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
